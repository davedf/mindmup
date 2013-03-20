var observable = function (base) {
	'use strict';
	var eventListenersByType = {};
	base.addEventListener = function (type, listener) {
		eventListenersByType[type] = eventListenersByType[type] || [];
		eventListenersByType[type].push(listener);
	};
	base.listeners = function (type) {
		var listenersByType = eventListenersByType[type] || [], result = [], i;
		for (i = listenersByType.length - 1; i >= 0; i -= 1) {
			result.push(listenersByType[i]);
		}
		return result;
	};
	base.removeEventListener = function (type, listener) {
		if (eventListenersByType[type]) {
			eventListenersByType[type] = eventListenersByType[type].filter(
				function (currentListener) {
					return currentListener !== listener;
				}
			);
		}
	};
	base.dispatchEvent = function (eventType) {
		var eventArguments, listeners, i;
		eventArguments = Array.prototype.slice.call(arguments, 1);
		listeners = base.listeners(eventType);
		for (i = 0; i < listeners.length; i += 1) {
			if (listeners[i].apply(base, eventArguments) === false) {
				break;
			}
		}
	};
	return base;
};
/*jslint eqeq: true, forin: true, nomen: true*/
/*global _, observable*/
var content = function (contentAggregate, progressCallback) {
	'use strict';
	var init = function (contentIdea) {
		if (contentIdea.ideas) {
			_.each(contentIdea.ideas, function (value, key) {
				contentIdea.ideas[parseFloat(key)] = init(value);
			});
		}
		contentIdea.id = contentIdea.id || contentAggregate.nextId();
		contentIdea.containsDirectChild = contentIdea.findChildRankById = function (childIdeaId) {
			return parseFloat(
				_.reduce(
					contentIdea.ideas,
					function (res, value, key) {
						return value.id == childIdeaId ? key : res;
					},
					undefined
				)
			);
		};
		contentIdea.findSubIdeaById = function (childIdeaId) {
			var myChild = _.find(contentIdea.ideas, function (idea) {
				return idea.id == childIdeaId;
			});
			return myChild || _.reduce(contentIdea.ideas, function (result, idea) {
				return result || idea.findSubIdeaById(childIdeaId);
			}, undefined);
		};
		contentIdea.find = function (predicate) {
			var current = predicate(contentIdea) ? [_.pick(contentIdea, 'id', 'title')] : [];
			if (_.size(contentIdea.ideas) === 0) {
				return current;
			}
			return _.reduce(contentIdea.ideas, function (result, idea) {
				return _.union(result, idea.find(predicate));
			}, current);
		};
		contentIdea.getStyle = function (name) {
			if (contentIdea.style && contentIdea.style[name]) {
				return contentIdea.style[name];
			}
			return false;
		};
		if (progressCallback) {
			progressCallback();
		}
		return contentIdea;
	},
		maxKey = function (kv_map, sign) {
			sign = sign || 1;
			if (_.size(kv_map) === 0) {
				return 0;
			}
			var current_keys = _.keys(kv_map);
			current_keys.push(0); /* ensure at least 0 is there for negative ranks */
			return _.max(_.map(current_keys, parseFloat), function (x) {
				return x * sign;
			});
		},
		nextChildRank = function (parentIdea) {
			var new_rank, counts, childRankSign = 1;
			if (parentIdea.id == contentAggregate.id) {
				counts = _.countBy(parentIdea.ideas, function (v, k) {
					return k < 0;
				});
				if ((counts['true'] || 0) < counts['false']) {
					childRankSign = -1;
				}
			}
			new_rank = maxKey(parentIdea.ideas, childRankSign) + childRankSign;
			return new_rank;
		},
		appendSubIdea = function (parentIdea, subIdea) {
			var rank;
			parentIdea.ideas = parentIdea.ideas || {};
			rank = nextChildRank(parentIdea);
			parentIdea.ideas[rank] = subIdea;
			return rank;
		},
		findIdeaById = function (ideaId) {
			ideaId = parseFloat(ideaId);
			return contentAggregate.id == ideaId ? contentAggregate : contentAggregate.findSubIdeaById(ideaId);
		},
		sameSideSiblingRanks = function (parentIdea, ideaRank) {
			return _(_.map(_.keys(parentIdea.ideas), parseFloat)).reject(function (k) {return k * ideaRank < 0; });
		},
		sign = function (number) {
			/* intentionally not returning 0 case, to help with split sorting into 2 groups */
			return number < 0 ? -1 : 1;
		},
		eventStack = [],
		redoStack = [],
		isRedoInProgress = false,
		notifyChange = function (method, args, undofunc) {
			eventStack.push({eventMethod: method, eventArgs: args, undoFunction: undofunc});
			if (isRedoInProgress) {
				contentAggregate.dispatchEvent('changed', 'redo');
			} else {
				contentAggregate.dispatchEvent('changed', method, args);
				redoStack = [];
			}
		},
		reorderChild = function (parentIdea, newRank, oldRank) {
			parentIdea.ideas[newRank] = parentIdea.ideas[oldRank];
			delete parentIdea.ideas[oldRank];
		},
		cachedId;
	contentAggregate.nextId = function nextId() {
		if (!cachedId) {
			cachedId =  contentAggregate.maxId();
		}
		cachedId += 1;
		return cachedId;
	};
	contentAggregate.maxId = function maxId(idea) {
		idea = idea || contentAggregate;
		if (!idea.ideas) {
			return idea.id || 0;
		}
		return _.reduce(
			idea.ideas,
			function (result, subidea) {
				return Math.max(result, maxId(subidea));
			},
			idea.id || 0
		);
	};
	contentAggregate.nextSiblingId = function (subIdeaId) {
		var parentIdea = contentAggregate.findParent(subIdeaId),
			currentRank,
			candidateSiblingRanks,
			siblingsAfter;
		if (!parentIdea) { return false; }
		currentRank = parentIdea.findChildRankById(subIdeaId);
		candidateSiblingRanks = sameSideSiblingRanks(parentIdea, currentRank);
		siblingsAfter = _.reject(candidateSiblingRanks, function (k) { return Math.abs(k) <= Math.abs(currentRank); });
		if (siblingsAfter.length === 0) { return false; }
		return parentIdea.ideas[_.min(siblingsAfter, Math.abs)].id;
	};
	contentAggregate.previousSiblingId = function (subIdeaId) {
		var parentIdea = contentAggregate.findParent(subIdeaId),
			currentRank,
			candidateSiblingRanks,
			siblingsBefore;
		if (!parentIdea) { return false; }
		currentRank = parentIdea.findChildRankById(subIdeaId);
		candidateSiblingRanks = sameSideSiblingRanks(parentIdea, currentRank);
		siblingsBefore = _.reject(candidateSiblingRanks, function (k) { return Math.abs(k) >= Math.abs(currentRank); });
		if (siblingsBefore.length === 0) { return false; }
		return parentIdea.ideas[_.max(siblingsBefore, Math.abs)].id;
	};
	contentAggregate.clone = function (subIdeaId) {
		var toClone = (subIdeaId && subIdeaId != contentAggregate.id && contentAggregate.findSubIdeaById(subIdeaId)) || contentAggregate;
		return JSON.parse(JSON.stringify(toClone));
	};
	/*** private utility methods ***/
	contentAggregate.findParent = function (subIdeaId, parentIdea) {
		parentIdea = parentIdea || contentAggregate;
		var childRank = parentIdea.findChildRankById(subIdeaId);
		if (childRank) {
			return parentIdea;
		}
		return _.reduce(
			parentIdea.ideas,
			function (result, child) {
				return result || contentAggregate.findParent(subIdeaId, child);
			},
			false
		);
	};

	/**** aggregate command processing methods ****/
	contentAggregate.paste = function (parentIdeaId, jsonToPaste) {
		var pasteParent = (parentIdeaId === contentAggregate.id) ?  contentAggregate : contentAggregate.findSubIdeaById(parentIdeaId),
			cleanUp = function (json) {
				var result =  _.omit(json, 'ideas', 'id'), index = 1, childKeys, sortedChildKeys;
				if (json.ideas) {
					childKeys = _.groupBy(_.map(_.keys(json.ideas), parseFloat), function (key) { return key > 0; });
					sortedChildKeys = _.sortBy(childKeys[true], Math.abs).concat(_.sortBy(childKeys[false], Math.abs));
					result.ideas = {};
					_.each(sortedChildKeys, function (key) {
						result.ideas[index++] = cleanUp(json.ideas[key]);
					});
				}
				return result;
			},
			newIdea = jsonToPaste && jsonToPaste.title && init(cleanUp(jsonToPaste)),
			newRank;
		if (!pasteParent || !newIdea) {
			return false;
		}
		newRank = appendSubIdea(pasteParent, newIdea);
		notifyChange('paste', [parentIdeaId, jsonToPaste, newIdea.id], function () {
			delete pasteParent.ideas[newRank];
		});
		return true;
	};
	contentAggregate.flip = function (ideaId) {
		var new_rank, max_rank, current_rank = contentAggregate.findChildRankById(ideaId);
		if (!current_rank) {
			return false;
		}
		max_rank = maxKey(contentAggregate.ideas, -1 * sign(current_rank));
		new_rank = max_rank - 10 * sign(current_rank);
		reorderChild(contentAggregate, new_rank, current_rank);
		notifyChange('flip', [ideaId], function () {
			reorderChild(contentAggregate, current_rank, new_rank);
		});
		return true;
	};
	contentAggregate.updateTitle = function (ideaId, title) {
		var idea = findIdeaById(ideaId), originalTitle;
		if (!idea) {
			return false;
		}
		originalTitle = idea.title;
		if (originalTitle == title) {
			return false;
		}
		idea.title = title;
		notifyChange('updateTitle', [ideaId, title], function () {
			idea.title = originalTitle;
		});
		return true;
	};
	contentAggregate.addSubIdea = function (parentId, ideaTitle) {
		var idea, parent = findIdeaById(parentId), newRank;
		if (!parent) {
			return false;
		}
		idea = init({
			title: ideaTitle
		});
		newRank = appendSubIdea(parent, idea);
		notifyChange('addSubIdea', [parentId, ideaTitle, idea.id], function () {
			delete parent.ideas[newRank];
		});
		return true;
	};
	contentAggregate.removeSubIdea = function (subIdeaId) {
		var parent = contentAggregate.findParent(subIdeaId), oldRank, oldIdea;
		if (parent) {
			oldRank = parent.findChildRankById(subIdeaId);
			oldIdea = parent.ideas[oldRank];
			delete parent.ideas[oldRank];
			notifyChange('removeSubIdea', [subIdeaId], function () {
				parent.ideas[oldRank] = oldIdea;
			});
			return true;
		}
		return false;
	};
	contentAggregate.insertIntermediate = function (inFrontOfIdeaId, title) {
		if (contentAggregate.id == inFrontOfIdeaId) {
			return false;
		}
		var childRank, oldIdea, newIdea, parentIdea = contentAggregate.findParent(inFrontOfIdeaId);
		if (!parentIdea) {
			return false;
		}
		childRank = parentIdea.findChildRankById(inFrontOfIdeaId);
		if (!childRank) {
			return false;
		}
		oldIdea = parentIdea.ideas[childRank];
		newIdea = init({
			title: title
		});
		parentIdea.ideas[childRank] = newIdea;
		newIdea.ideas = {
			1: oldIdea
		};
		notifyChange('insertIntermediate', [inFrontOfIdeaId, title, newIdea.id], function () {
			parentIdea.ideas[childRank] = oldIdea;
		});
		return true;
	};
	contentAggregate.changeParent = function (ideaId, newParentId) {
		var oldParent, oldRank, newRank, idea, parent = findIdeaById(newParentId);
		if (ideaId == newParentId) {
			return false;
		}
		if (!parent) {
			return false;
		}
		idea = contentAggregate.findSubIdeaById(ideaId);
		if (!idea) {
			return false;
		}
		if (idea.findSubIdeaById(newParentId)) {
			return false;
		}
		if (parent.containsDirectChild(ideaId)) {
			return false;
		}
		oldParent = contentAggregate.findParent(ideaId);
		if (!oldParent) {
			return false;
		}
		oldRank = oldParent.findChildRankById(ideaId);
		newRank = appendSubIdea(parent, idea);
		delete oldParent.ideas[oldRank];
		notifyChange('changeParent', [ideaId, newParentId], function () {
			oldParent.ideas[oldRank] = idea;
			delete parent.ideas[newRank];
		});
		return true;
	};
	contentAggregate.updateStyle = function (ideaId, styleName, styleValue) {
		var idea = findIdeaById(ideaId), oldStyle;
		if (!idea) {
			return false;
		}
		oldStyle = _.extend({}, idea.style);
		idea.style = _.extend({}, idea.style);
		if (!styleValue || styleValue === "false") {
			if (!idea.style[styleName]) {
				return false;
			}
			delete idea.style[styleName];
		} else {
			/* leave ==, if it's a number and someone sends the equal string, it's still the same */
			if (idea.style[styleName] == styleValue) {
				return false;
			}
			idea.style[styleName] = styleValue;
		}
		if (_.size(idea.style) === 0) {
			delete idea.style;
		}
		notifyChange('updateStyle', [ideaId, styleName, styleValue], function () {
			idea.style = oldStyle;
		});
		return true;
	};
	contentAggregate.moveRelative = function (ideaId, relativeMovement) {
		var parentIdea = contentAggregate.findParent(ideaId),
			current_rank = parentIdea && parentIdea.findChildRankById(ideaId),
			sibling_ranks = current_rank && _.sortBy(sameSideSiblingRanks(parentIdea, current_rank), Math.abs),
			currentIndex = sibling_ranks && sibling_ranks.indexOf(current_rank),
			/* we call positionBefore, so movement down is actually 2 spaces, not 1 */
			newIndex = currentIndex + (relativeMovement > 0 ? relativeMovement + 1 : relativeMovement),
			beforeSibling = (newIndex >= 0) && parentIdea && sibling_ranks && parentIdea.ideas[sibling_ranks[newIndex]];
		if (newIndex < 0 || !parentIdea) {
			return false;
		}
		return contentAggregate.positionBefore(ideaId, beforeSibling && beforeSibling.id, parentIdea);
	};
	contentAggregate.positionBefore = function (ideaId, positionBeforeIdeaId, parentIdea) {
		parentIdea = parentIdea || contentAggregate;
		var new_rank, after_rank, sibling_ranks, candidate_siblings, before_rank, max_rank, current_rank;
		current_rank = parentIdea.findChildRankById(ideaId);
		if (!current_rank) {
			return _.reduce(
				parentIdea.ideas,
				function (result, idea) {
					return result || contentAggregate.positionBefore(ideaId, positionBeforeIdeaId, idea);
				},
				false
			);
		}
		if (ideaId == positionBeforeIdeaId) {
			return false;
		}
		new_rank = 0;
		if (positionBeforeIdeaId) {
			after_rank = parentIdea.findChildRankById(positionBeforeIdeaId);
			if (!after_rank) {
				return false;
			}
			sibling_ranks = sameSideSiblingRanks(parentIdea, current_rank);
			candidate_siblings = _.reject(_.sortBy(sibling_ranks, Math.abs), function (k) {
				return Math.abs(k) >= Math.abs(after_rank);
			});
			before_rank = candidate_siblings.length > 0 ? _.max(candidate_siblings, Math.abs) : 0;
			if (before_rank == current_rank) {
				return false;
			}
			new_rank = before_rank + (after_rank - before_rank) / 2;
		} else {
			max_rank = maxKey(parentIdea.ideas, current_rank < 0 ? -1 : 1);
			if (max_rank == current_rank) {
				return false;
			}
			new_rank = max_rank + 10 * (current_rank < 0 ? -1 : 1);
		}
		if (new_rank == current_rank) {
			return false;
		}
		reorderChild(parentIdea, new_rank, current_rank);

		notifyChange('positionBefore', [ideaId, positionBeforeIdeaId], function () {
			reorderChild(parentIdea, current_rank, new_rank);
		});
		return true;
	};
	/* undo/redo */
	contentAggregate.undo = function () {
		var topEvent;
		topEvent = eventStack.pop();
		if (topEvent && topEvent.undoFunction) {
			topEvent.undoFunction();
			redoStack.push(topEvent);
			contentAggregate.dispatchEvent('changed', 'undo', []);
			return true;
		}
		return false;
	};
	contentAggregate.redo = function () {
		var topEvent;
		topEvent = redoStack.pop();
		if (topEvent) {
			isRedoInProgress = true;
			contentAggregate[topEvent.eventMethod].apply(contentAggregate, topEvent.eventArgs);
			isRedoInProgress = false;
			return true;
		}
		return false;
	};
	init(contentAggregate);
	return observable(contentAggregate);
};
/*jslint nomen: true*/
/*global _*/
var MAPJS = MAPJS || {};
(function () {
	'use strict';
	MAPJS.calculateDimensions = function calculateDimensions(idea, dimensionProvider, margin) {
		var dimensions = dimensionProvider(idea.title),
			result = _.extend(_.pick(idea, ['id', 'title', 'style']), {
				width: dimensions.width + 2 * margin,
				height: dimensions.height + 2 * margin
			}),
			leftOrRight,
			subIdeaWidths = [0, 0],
			subIdeaHeights = [0, 0],
			subIdeaRank,
			subIdea,
			subIdeaDimensions;
		if (idea.ideas && !idea.getStyle('collapsed')) {
			result.ideas = {};
			for (subIdeaRank in idea.ideas) {
				subIdea = idea.ideas[subIdeaRank];
				subIdeaDimensions = calculateDimensions(subIdea, dimensionProvider, margin);
				result.ideas[subIdeaRank] = subIdeaDimensions;
				leftOrRight = subIdeaRank > 0 ? 1 : 0;
				subIdeaWidths[leftOrRight] = Math.max(subIdeaWidths[leftOrRight], subIdeaDimensions.Width);
				subIdeaHeights[leftOrRight] += subIdeaDimensions.Height;
			}
		}
		result.WidthLeft = subIdeaWidths[0] || 0;
		result.Width = result.width + subIdeaWidths[0] + subIdeaWidths[1];
		result.Height = Math.max(result.height, subIdeaHeights[0], subIdeaHeights[1]);
		return result;
	};
	MAPJS.calculatePositions = function calculatePositions(idea, dimensionProvider, margin, x0, y0, result, isLeftSubtree) {
		var ranks,
			subIdeaRank,
			i,
			subIdeaDimensions,
			leftOrRight,
			totalHeights = [0, 0],
			subIdeaCurrentY0 = [y0, y0];
		result = result || MAPJS.calculateDimensions(idea, dimensionProvider, margin);
		x0 += result.WidthLeft;
		result.x = x0 + margin;
		result.y = y0 + 0.5 * (result.Height - result.height) + margin;
		if (result.ideas) {
			ranks = [];
			for (subIdeaRank in result.ideas) {
				ranks.push(parseFloat(subIdeaRank));
				subIdeaDimensions = result.ideas[subIdeaRank];
				if (isLeftSubtree) {
					subIdeaRank = -subIdeaRank;
				}
				totalHeights[subIdeaRank < 0 ? 0 : 1] += subIdeaDimensions.Height;
			}
			subIdeaCurrentY0[0] += 0.5 * (result.Height - totalHeights[0]);
			subIdeaCurrentY0[1] += 0.5 * (result.Height - totalHeights[1]);
			ranks.sort(function ascending(firstRank, secondRank) {
				if (firstRank >= 0 && secondRank >= 0) {
					return secondRank - firstRank;
				}
				if (firstRank < 0 && secondRank < 0) {
					return firstRank - secondRank;
				}
				return secondRank - firstRank;
			});
			for (i = ranks.length - 1; i >= 0; i -= 1) {
				subIdeaRank = ranks[i];
				subIdeaDimensions = result.ideas[subIdeaRank];
				if (isLeftSubtree) {
					subIdeaRank = -subIdeaRank;
				}
				leftOrRight = subIdeaRank > 0 ? 1 : 0;
				calculatePositions(undefined, dimensionProvider, margin, x0 + (leftOrRight ? result.width : -subIdeaDimensions.width), subIdeaCurrentY0[leftOrRight], subIdeaDimensions, isLeftSubtree || leftOrRight === 0);
				subIdeaCurrentY0[leftOrRight] += subIdeaDimensions.Height;
			}
		}
		return result;
	};
	MAPJS.defaultStyles = {
		root: {background: '#22AAE0'},
		nonRoot: {background: '#E0E0E0'}
	};

	MAPJS.calculateLayout = function (idea, dimensionProvider, margin) {
		margin = margin || 10;
		var result = {
			nodes: {},
			connectors: {}
		},
			root = MAPJS.calculatePositions(idea, dimensionProvider, margin, 0, 0),
			calculateLayoutInner = function (positions, level) {
				var subIdeaRank, from, to, isRoot = level === 1,
					defaultStyle = MAPJS.defaultStyles[isRoot ? 'root' : 'nonRoot'];
				result.nodes[positions.id] = _.extend(_.pick(positions, ['id', 'width', 'height', 'title']), {
					x: positions.x - root.x - 0.5 * root.width + margin,
					y: positions.y - root.y - 0.5 * root.height + margin,
					level: level,
					style: _.extend({}, defaultStyle, positions.style)
				});
				if (positions.ideas) {
					for (subIdeaRank in positions.ideas) {
						calculateLayoutInner(positions.ideas[subIdeaRank], level + 1);
						from = positions.id;
						to = positions.ideas[subIdeaRank].id;
						result.connectors[to] = {
							from: from,
							to: to
						};
					}
				}
			};
		MAPJS.LayoutCompressor.compress(root);
		calculateLayoutInner(root, 1);
		return result;
	};
	MAPJS.calculateFrame = function (nodes, margin) {
		margin = margin || 0;
		var result = {
			top: _.min(nodes, function (node) {return node.y; }).y - margin,
			left: _.min(nodes, function (node) {return node.x; }).x - margin
		};
		result.width = margin + _.max(_.map(nodes, function (node) { return node.x + node.width; })) - result.left;
		result.height = margin + _.max(_.map(nodes, function (node) { return node.y + node.height; })) - result.top;
		return result;
	};
}());
/*jslint forin: true, nomen: true*/
/*global MAPJS, _*/
MAPJS.LayoutCompressor = {};
MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodes = function (firstNode, secondNode) {
	'use strict';
	var isFirstSecond, isSecondFirst, result = Infinity;
	isFirstSecond = firstNode.x + firstNode.width <= secondNode.x;
	isSecondFirst = secondNode.x + secondNode.width <= firstNode.x;
	if (!(isFirstSecond || isSecondFirst)) {
		result = firstNode.y < secondNode.y ? secondNode.y - (firstNode.y + firstNode.height) : firstNode.y - (secondNode.y + secondNode.height);
	}
	return result;
};
MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodeLists = function (firstNodeList, secondNodeList) {
	'use strict';
	var result = Infinity, i, j;
	for (i = firstNodeList.length - 1; i >= 0; i -= 1) {
		for (j = secondNodeList.length - 1; j >= 0; j -= 1) {
			result = Math.min(result, MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodes(firstNodeList[i], secondNodeList[j]));
		}
	}
	return result;
};
MAPJS.LayoutCompressor.nodeAndConnectorCollisionBox = function (node, parent) {
	'use strict';
	return {
		x: Math.min(node.x, parent.x + 0.5 * parent.width),
		y: Math.min(node.y, parent.y),
		width: node.width + 0.5 * parent.width,
		height: Math.max(node.y + node.height, parent.y + parent.height) - Math.min(node.y, parent.y)
	};
};
MAPJS.LayoutCompressor.getSubTreeNodeList = function getSubTreeNodeList(positions, result, parent) {
	'use strict';
	var subIdeaRank;
	result = result || [];
	result.push(_.pick(positions, 'x', 'y', 'width', 'height'));
	if (parent) {
		result.push(MAPJS.LayoutCompressor.nodeAndConnectorCollisionBox(positions, parent));
	}
	for (subIdeaRank in positions.ideas) {
		getSubTreeNodeList(positions.ideas[subIdeaRank], result, positions);
	}
	return result;
};
MAPJS.LayoutCompressor.moveSubTreeVertically = function moveSubTreeVertically(positions, delta) {
	'use strict';
	var subIdeaRank;
	positions.y += delta;
	for (subIdeaRank in positions.ideas) {
		moveSubTreeVertically(positions.ideas[subIdeaRank], delta);
	}
};
MAPJS.LayoutCompressor.centerSubTrees = function (positions) {
	'use strict';
	var subIdeaRank, ranksInOrder = [], i, allLowerNodes = [], lowerSubtree, upperSubtree, verticalDistance;
	for (subIdeaRank in positions.ideas) {
		subIdeaRank = parseFloat(subIdeaRank);
		if (subIdeaRank > 0) {
			ranksInOrder.push(subIdeaRank);
		}
	}
	if (ranksInOrder.length > 2) {
		ranksInOrder.sort(function ascending(first, second) {
			return second - first;
		});
		for (i = 1; i < ranksInOrder.length - 1; i += 1) {
			lowerSubtree = positions.ideas[ranksInOrder[i - 1]];
			upperSubtree = positions.ideas[ranksInOrder[i]];
			allLowerNodes = allLowerNodes.concat(MAPJS.LayoutCompressor.getSubTreeNodeList(lowerSubtree));
			verticalDistance = MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodeLists(
				allLowerNodes,
				MAPJS.LayoutCompressor.getSubTreeNodeList(upperSubtree)
			);
			if (verticalDistance > 0 && verticalDistance < Infinity) {
				MAPJS.LayoutCompressor.moveSubTreeVertically(upperSubtree, 0.5 * verticalDistance);
			}
		}
	}
};
MAPJS.LayoutCompressor.compress = function compress(positions) {
	'use strict';
	var subIdeaRank,
		ranksInOrder = [],
		negativeRanksInOrder = [],
		middle,
		delta,
		compressOneSide = function (ranks) {
			var i,
				upperSubtree,
				lowerSubtree,
				verticalDistance,
				allUpperNodes = [];
			for (i = 0; i < ranks.length - 1; i += 1) {
				upperSubtree = positions.ideas[ranks[i]];
				lowerSubtree = positions.ideas[ranks[i + 1]];
				allUpperNodes = allUpperNodes.concat(MAPJS.LayoutCompressor.getSubTreeNodeList(upperSubtree));
				verticalDistance = MAPJS.LayoutCompressor.getVerticalDistanceBetweenNodeLists(
					allUpperNodes,
					MAPJS.LayoutCompressor.getSubTreeNodeList(lowerSubtree)
				);
				if (verticalDistance < Infinity) {
					MAPJS.LayoutCompressor.moveSubTreeVertically(lowerSubtree, -verticalDistance);
				}
			}
		};
	for (subIdeaRank in positions.ideas) {
		subIdeaRank = parseFloat(subIdeaRank);
		compress(positions.ideas[subIdeaRank]);
		(subIdeaRank >= 0 ? ranksInOrder : negativeRanksInOrder).push(subIdeaRank);
	}
	ranksInOrder.sort(function ascending(first, second) {
		return first - second;
	});
	negativeRanksInOrder.sort(function descending(first, second) {
		return second - first;
	});
	compressOneSide(ranksInOrder);
	compressOneSide(negativeRanksInOrder);
	if (ranksInOrder.length) {
		middle = 0.5 * (positions.ideas[ranksInOrder[0]].y + positions.ideas[ranksInOrder[ranksInOrder.length - 1]].y + positions.ideas[ranksInOrder[ranksInOrder.length - 1]].height);
		positions.y = middle - 0.5 * positions.height;
	}
	if (negativeRanksInOrder.length) {
		middle = 0.5 * (positions.ideas[negativeRanksInOrder[0]].y + positions.ideas[negativeRanksInOrder[negativeRanksInOrder.length - 1]].y + positions.ideas[negativeRanksInOrder[negativeRanksInOrder.length - 1]].height);
		delta = positions.y - middle + 0.5 * positions.height;
		negativeRanksInOrder.forEach(function (rank) {
			MAPJS.LayoutCompressor.moveSubTreeVertically(positions.ideas[rank], delta);
		});
	}
	MAPJS.LayoutCompressor.centerSubTrees(positions);
	return positions;
};
/*jslint forin: true, nomen: true*/
/*global _, observable*/
var MAPJS = MAPJS || {};
MAPJS.MapModel = function (mapRepository, layoutCalculator, titlesToRandomlyChooseFrom, intermediaryTitlesToRandomlyChooseFrom) {
	'use strict';
	titlesToRandomlyChooseFrom = titlesToRandomlyChooseFrom || ['double click to edit'];
	intermediaryTitlesToRandomlyChooseFrom = intermediaryTitlesToRandomlyChooseFrom || titlesToRandomlyChooseFrom;
	var self = this,
		analytic,
		currentLayout = {
			nodes: {},
			connectors: {}
		},
		idea,
		isInputEnabled,
		currentlySelectedIdeaId,
		markedIdeaId,
		getRandomTitle = function (titles) {
			return titles[Math.floor(titles.length * Math.random())];
		},
		horizontalSelectionThreshold = 300,
		moveNodes = function (nodes, deltaX, deltaY) {
			_.each(nodes, function (node) {
				node.x += deltaX;
				node.y += deltaY;
			});
		},
		updateCurrentLayout = function (newLayout, contextNodeId) {
			var nodeId, newNode, oldNode, newConnector, oldConnector;
			if (contextNodeId && currentLayout.nodes[contextNodeId] && newLayout.nodes[contextNodeId]) {
				moveNodes(newLayout.nodes,
					currentLayout.nodes[contextNodeId].x - newLayout.nodes[contextNodeId].x,
					currentLayout.nodes[contextNodeId].y - newLayout.nodes[contextNodeId].y
					);
			}
			for (nodeId in currentLayout.connectors) {
				newConnector = newLayout.connectors[nodeId];
				oldConnector = currentLayout.connectors[nodeId];
				if (!newConnector || newConnector.from !== oldConnector.from || newConnector.to !== oldConnector.to) {
					self.dispatchEvent('connectorRemoved', oldConnector);
				}
			}
			for (nodeId in currentLayout.nodes) {
				nodeId = parseFloat(nodeId);
				oldNode = currentLayout.nodes[nodeId];
				newNode = newLayout.nodes[nodeId];
				if (!newNode) {
					if (nodeId === currentlySelectedIdeaId) {
						self.selectNode(idea.id);
					}
					self.dispatchEvent('nodeRemoved', oldNode);
				}
			}
			for (nodeId in newLayout.nodes) {
				oldNode = currentLayout.nodes[nodeId];
				newNode = newLayout.nodes[nodeId];
				if (!oldNode) {
					self.dispatchEvent('nodeCreated', newNode);
				} else {
					if (newNode.x !== oldNode.x || newNode.y !== oldNode.y) {
						self.dispatchEvent('nodeMoved', newNode);
					}
					if (newNode.title !== oldNode.title) {
						self.dispatchEvent('nodeTitleChanged', newNode);
					}
					if (!_.isEqual(newNode.style || {}, oldNode.style || {})) {
						self.dispatchEvent('nodeStyleChanged', newNode);
					}
				}
			}
			for (nodeId in newLayout.connectors) {
				newConnector = newLayout.connectors[nodeId];
				oldConnector = currentLayout.connectors[nodeId];
				if (!oldConnector || newConnector.from !== oldConnector.from || newConnector.to !== oldConnector.to) {
					self.dispatchEvent('connectorCreated', newConnector);
				}
			}
			currentLayout = newLayout;
		},
		onIdeaChanged = function (command, args) {
			var newIdeaId, contextNodeId;
			contextNodeId = command === 'updateStyle' ? args[0] : undefined;
			updateCurrentLayout(layoutCalculator(idea), contextNodeId);
			if (command === 'addSubIdea') {
				newIdeaId = args[2];
				self.selectNode(newIdeaId);
				self.editNode(false, true);
			}
			if (command === 'insertIntermediate') {
				newIdeaId = args[2];
				self.selectNode(newIdeaId);
				self.editNode(false, true);
			}
		},
		currentlySelectedIdea = function () {
			return (idea.findSubIdeaById(currentlySelectedIdeaId) || idea);
		},
		ensureNodeIsExpanded = function (source, nodeId) {
			var node = idea.findSubIdeaById(nodeId) || idea;
			if (node.getStyle('collapsed')) {
				idea.updateStyle(nodeId, 'collapsed', false);
			}
		};
	observable(this);
	analytic = self.dispatchEvent.bind(self, 'analytic', 'mapModel');
	this.setIdea = function (anIdea) {
		if (idea) {
			idea.removeEventListener('changed', onIdeaChanged);
			currentlySelectedIdeaId = undefined;
		}
		idea = anIdea;
		idea.addEventListener('changed', onIdeaChanged);
		onIdeaChanged();
		self.selectNode(idea.id);
	};
	mapRepository.addEventListener('mapLoaded', this.setIdea);
	this.setInputEnabled = function (value) {
		if (isInputEnabled !== value) {
			isInputEnabled = value;
			self.dispatchEvent('inputEnabledChanged', value);
		}
	};
	this.selectNode = function (id) {
		if (id !== currentlySelectedIdeaId) {
			if (currentlySelectedIdeaId) {
				self.dispatchEvent('nodeSelectionChanged', currentlySelectedIdeaId, false);
			}
			currentlySelectedIdeaId = id;
			self.dispatchEvent('nodeSelectionChanged', id, true);
		}
	};
	this.getSelectedStyle = function (prop) {
		var node = currentLayout.nodes[currentlySelectedIdeaId];
		return node && node.style && node.style[prop];
	};
	this.toggleCollapse = function (source) {
		var isCollapsed = currentlySelectedIdea().getStyle('collapsed');
		this.collapse(source, !isCollapsed);
	};
	this.collapse = function (source, doCollapse) {
		analytic('collapse:' + doCollapse, source);
		var node = currentlySelectedIdea();
		if (node.ideas && _.size(node.ideas) > 0) {
			idea.updateStyle(currentlySelectedIdeaId, 'collapsed', doCollapse);
		}
	};
	this.updateStyle = function (source, prop, value) {
		analytic('updateStyle:' + prop, source);
		/*jslint eqeq:true */
		if (this.getSelectedStyle(prop) != value) {
			idea.updateStyle(currentlySelectedIdeaId, prop, value);
		}
	};
	this.addSubIdea = function (source) {
		analytic('addSubIdea', source);
		ensureNodeIsExpanded(source, currentlySelectedIdeaId);
		idea.addSubIdea(currentlySelectedIdeaId, getRandomTitle(titlesToRandomlyChooseFrom));
	};
	this.insertIntermediate = function (source) {
		if (currentlySelectedIdeaId === idea.id) {
			return false;
		}
		idea.insertIntermediate(currentlySelectedIdeaId, getRandomTitle(intermediaryTitlesToRandomlyChooseFrom));
		analytic('insertIntermediate', source);
	};
	this.addSiblingIdea = function (source) {
		analytic('addSiblingIdea', source);
		var parent = idea.findParent(currentlySelectedIdeaId) || idea;
		idea.addSubIdea(parent.id, getRandomTitle(titlesToRandomlyChooseFrom));
	};
	this.removeSubIdea = function (source) {
		analytic('removeSubIdea', source);
		var parent = idea.findParent(currentlySelectedIdeaId);
		if (idea.removeSubIdea(currentlySelectedIdeaId)) {
			self.selectNode(parent.id);
		}
	};
	this.updateTitle = function (ideaId, title) {
		idea.updateTitle(ideaId, title);
	};
	this.editNode = function (source, shouldSelectAll) {
		if (source) {
			analytic('editNode', source);
		}
		var title = currentlySelectedIdea().title;
		if (intermediaryTitlesToRandomlyChooseFrom.indexOf(title) !== -1 ||
				 titlesToRandomlyChooseFrom.indexOf(title) !== -1) {
			shouldSelectAll = true;
		}
		self.dispatchEvent('nodeEditRequested:' + currentlySelectedIdeaId, shouldSelectAll);

	};
	this.scaleUp = function (source) {
		self.scale(source, 1.25);
	};
	this.scaleDown = function (source) {
		self.scale(source, 0.8);
	};
	this.scale = function (source, scaleMultiplier, zoomPoint) {
		self.dispatchEvent('mapScaleChanged', scaleMultiplier, zoomPoint);
		analytic(scaleMultiplier < 1 ? 'scaleDown' : 'scaleUp', source);
	};
	this.move = function (source, deltaX, deltaY) {
		self.dispatchEvent('mapMoveRequested', deltaX, deltaY);
		analytic('move', source);
	};
	this.resetView = function (source) {
		self.dispatchEvent('mapViewResetRequested');
		analytic('resetView', source);
	};
	(function () {
		var isRootOrRightHalf = function (id) {
				return currentLayout.nodes[id].x >= currentLayout.nodes[idea.id].x;
			},
			isRootOrLeftHalf = function (id) {
				return currentLayout.nodes[id].x <= currentLayout.nodes[idea.id].x;
			},
			nodesWithIDs = function () {
				return _.map(currentLayout.nodes,
					function (n, nodeId) {
						return _.extend({ id: parseInt(nodeId, 10)}, n);
					});
			};
		self.selectNodeLeft = function (source) {
			var node,
				rank,
				isRoot = currentlySelectedIdeaId === idea.id,
				targetRank = isRoot ? -Infinity : Infinity,
				targetNode;
			analytic('selectNodeLeft', source);
			if (isRootOrLeftHalf(currentlySelectedIdeaId)) {
				node = idea.id === currentlySelectedIdeaId ? idea : idea.findSubIdeaById(currentlySelectedIdeaId);
				ensureNodeIsExpanded(source, node.id);
				for (rank in node.ideas) {
					rank = parseFloat(rank);
					if ((isRoot && rank < 0 && rank > targetRank) || (!isRoot && rank > 0 && rank < targetRank)) {
						targetRank = rank;
					}
				}
				if (targetRank !== Infinity && targetRank !== -Infinity) {
					self.selectNode(node.ideas[targetRank].id);
				}
			} else {
				self.selectNode(idea.findParent(currentlySelectedIdeaId).id);
			}
		};
		self.selectNodeRight = function (source) {
			var node, rank, minimumPositiveRank = Infinity;
			analytic('selectNodeRight', source);
			if (isRootOrRightHalf(currentlySelectedIdeaId)) {
				node = idea.id === currentlySelectedIdeaId ? idea : idea.findSubIdeaById(currentlySelectedIdeaId);
				ensureNodeIsExpanded(source, node.id);
				for (rank in node.ideas) {
					rank = parseFloat(rank);
					if (rank > 0 && rank < minimumPositiveRank) {
						minimumPositiveRank = rank;
					}
				}
				if (minimumPositiveRank !== Infinity) {
					self.selectNode(node.ideas[minimumPositiveRank].id);
				}
			} else {
				self.selectNode(idea.findParent(currentlySelectedIdeaId).id);
			}
		};

		self.selectNodeUp = function (source) {
			var previousSibling = idea.previousSiblingId(currentlySelectedIdeaId),
				nodesAbove,
				closestNode,
				currentNode = currentLayout.nodes[currentlySelectedIdeaId];
			analytic('selectNodeUp', source);
			if (previousSibling) {
				self.selectNode(previousSibling);
			} else {
				if (!currentNode) { return; }
				nodesAbove = _.reject(nodesWithIDs(), function (node) {
					return node.y >= currentNode.y || Math.abs(node.x - currentNode.x) > horizontalSelectionThreshold;
				});
				if (_.size(nodesAbove) === 0) {
					return;
				}
				closestNode = _.min(nodesAbove, function (node) {
					return Math.pow(node.x - currentNode.x, 2) + Math.pow(node.y - currentNode.y, 2);
				});
				self.selectNode(closestNode.id);
			}
		};
		self.selectNodeDown = function (source) {
			var nextSibling = idea.nextSiblingId(currentlySelectedIdeaId),
				nodesBelow,
				closestNode,
				currentNode = currentLayout.nodes[currentlySelectedIdeaId];
			analytic('selectNodeDown', source);
			if (nextSibling) {
				self.selectNode(nextSibling);
			} else {
				if (!currentNode) { return; }
				nodesBelow = _.reject(nodesWithIDs(), function (node) {
					return node.y <= currentNode.y || Math.abs(node.x - currentNode.x) > horizontalSelectionThreshold;
				});
				if (_.size(nodesBelow) === 0) {
					return;
				}
				closestNode = _.min(nodesBelow, function (node) {
					return Math.pow(node.x - currentNode.x, 2) + Math.pow(node.y - currentNode.y, 2);
				});
				self.selectNode(closestNode.id);
			}

		};
		self.undo = function (source) {
			analytic('undo', source);
			idea.undo();
		};
		self.redo = function (source) {
			analytic('redo', source);
			idea.redo();
		};
		self.moveRelative = function (source, relativeMovement) {
			analytic('moveRelative', source);
			idea.moveRelative(currentlySelectedIdeaId, relativeMovement);
		};
		self.cut = function (source) {
			analytic('cut', source);
			self.clipBoard = idea.clone(currentlySelectedIdeaId);
			idea.removeSubIdea(currentlySelectedIdeaId);
		};
		self.copy = function (source) {
			analytic('copy', source);
			self.clipBoard = idea.clone(currentlySelectedIdeaId);
		};
		self.paste = function (source) {
			analytic('paste', source);
			idea.paste(currentlySelectedIdeaId, self.clipBoard);
		};
	}());
	//Todo - clean up this shit below
	(function () {
		var currentDroppable,
			updateCurrentDroppable = function (value) {
				if (currentDroppable !== value) {
					if (currentDroppable) {
						self.dispatchEvent('nodeDroppableChanged', currentDroppable, false);
					}
					currentDroppable = value;
					if (currentDroppable) {
						self.dispatchEvent('nodeDroppableChanged', currentDroppable, true);
					}
				}
			},
			canDropOnNode = function (id, x, y, node) {
				return id !== node.id
					&& x >= node.x
					&& y >= node.y
					&& x <= node.x + node.width - 2 * 10
					&& y <= node.y + node.height - 2 * 10;
			},
			tryFlip = function (rootNode, nodeBeingDragged, nodeDragEndX) {
				var flipRightToLeft = rootNode.x < nodeBeingDragged.x && nodeDragEndX < rootNode.x,
					flipLeftToRight = rootNode.x > nodeBeingDragged.x && rootNode.x < nodeDragEndX;
				if (flipRightToLeft || flipLeftToRight) {
					return idea.flip(nodeBeingDragged.id);
				}
				return false;
			};
		self.nodeDragMove = function (id, x, y) {
			var nodeId, node;
			for (nodeId in currentLayout.nodes) {
				nodeId = parseFloat(nodeId);
				node = currentLayout.nodes[nodeId];
				if (canDropOnNode(id, x, y, node)) {
					updateCurrentDroppable(nodeId);
					return;
				}
			}
			updateCurrentDroppable(undefined);
		};
		self.nodeDragEnd = function (id, x, y) {
			var nodeBeingDragged = currentLayout.nodes[id],
				nodeId,
				node,
				rootNode = currentLayout.nodes[idea.id],
				verticallyClosestNode = { id: null, y: Infinity };
			updateCurrentDroppable(undefined);
			self.dispatchEvent('nodeMoved', nodeBeingDragged);
			for (nodeId in currentLayout.nodes) {
				node = currentLayout.nodes[nodeId];
				if (canDropOnNode(id, x, y, node)) {
					if (!idea.changeParent(id, nodeId)) {
						self.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
					}
					return;
				}
				if ((nodeBeingDragged.x === node.x || nodeBeingDragged.x + nodeBeingDragged.width === node.x + node.width) && y < node.y) {
					if (!verticallyClosestNode || node.y < verticallyClosestNode.y) {
						verticallyClosestNode = node;
					}
				}
			}
			if (tryFlip(rootNode, nodeBeingDragged, x)) {
				return;
			}
			if (idea.positionBefore(id, verticallyClosestNode.id)) {
				return;
			}
			self.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
		};
	}());
};
/*global _, Kinetic, MAPJS*/
/*jslint nomen: true*/
(function () {
	'use strict';
	var horizontalConnector, calculateConnector, calculateConnectorInner;
	Kinetic.Connector = function (config) {
		var oldTransitionTo;
		this.shapeFrom = config.shapeFrom;
		this.shapeTo = config.shapeTo;
		this.shapeType = 'Connector';
		Kinetic.Shape.call(this, config);
		oldTransitionTo = this.transitionTo.bind(this);
		this.transitionTo = function (transition) {
			if (!(this.shapeFrom.isVisible || this.shapeTo.isVisible())) {
				transition.duration = 0.01;
			}
			oldTransitionTo(transition);
		};
		this._setDrawFuncs();
	};
	horizontalConnector = function (parentX, parentY, parentWidth, parentHeight,
			childX, childY, childWidth, childHeight) {
		var childHorizontalOffset = parentX < childX ? 0.1 : 0.9,
			parentHorizontalOffset = 1 - childHorizontalOffset;
		return {
			from: {
				x: parentX + parentHorizontalOffset * parentWidth,
				y: parentY + 0.5 * parentHeight
			},
			to: {
				x: childX + childHorizontalOffset * childWidth,
				y: childY + 0.5 * childHeight
			},
			controlPointOffset: 0
		};
	};
	calculateConnector = function (parent, child) {
		return calculateConnectorInner(parent.attrs.x, parent.attrs.y, parent.getWidth(), parent.getHeight(),
			child.attrs.x, child.attrs.y, child.getWidth(), child.getHeight());
	};
	calculateConnectorInner = _.memoize(function (parentX, parentY, parentWidth, parentHeight,
			childX, childY, childWidth, childHeight) {
		var tolerance = 10,
			childMid = childY + childHeight * 0.5,
			parentMid = parentY + parentHeight * 0.5,
			childHorizontalOffset;
		if (Math.abs(parentMid - childMid) + tolerance < Math.max(childHeight, parentHeight * 0.75)) {
			return horizontalConnector(parentX, parentY, parentWidth, parentHeight, childX, childY, childWidth, childHeight);
		}
		childHorizontalOffset = parentX < childX ? 0 : 1;
		return {
			from: {
				x: parentX + 0.5 * parentWidth,
				y: parentY + 0.5 * parentHeight
			},
			to: {
				x: childX + childHorizontalOffset * childWidth,
				y: childY + 0.5 * childHeight
			},
			controlPointOffset: 0.75
		};
	}, function () {
		return _.toArray(arguments).join(',');
	});
	Kinetic.Connector.prototype = {
		isVisible: function (offset) {
			var stage = this.getStage(),
				conn = calculateConnector(this.shapeFrom, this.shapeTo),
				x = Math.min(conn.from.x, conn.to.x),
				y = Math.min(conn.from.y, conn.to.y),
				rect = new MAPJS.Rectangle(x, y, Math.max(conn.from.x, conn.to.x) - x, Math.max(conn.from.y, conn.to.y) - y);
			return stage && stage.isRectVisible(rect, offset);
		},
		drawFunc: function (canvas) {
			var context = canvas.getContext(),
				shapeFrom = this.shapeFrom,
				shapeTo = this.shapeTo,
				conn,
				offset,
				maxOffset;
			if (!this.isVisible()) {
				return;
			}
			conn = calculateConnector(shapeFrom, shapeTo);
			if (!conn) {
				return;
			}
			context.beginPath();
			context.moveTo(conn.from.x, conn.from.y);
			offset = conn.controlPointOffset * (conn.from.y - conn.to.y);
			maxOffset = Math.min(shapeTo.getHeight(), shapeFrom.getHeight()) * 1.5;
			offset = Math.max(-maxOffset, Math.min(maxOffset, offset));
			context.quadraticCurveTo(conn.from.x, conn.to.y - offset, conn.to.x, conn.to.y);
			canvas.stroke(this);
		}
	};
	Kinetic.Global.extend(Kinetic.Connector, Kinetic.Shape);
}());
/*global MAPJS, Color, _, console, jQuery, Kinetic*/
/*jslint nomen: true, newcap: true*/
(function () {
	'use strict';
	/*shamelessly copied from http://james.padolsey.com/javascript/wordwrap-for-javascript */
	var COLUMN_WORD_WRAP_LIMIT = 25;
	function wordWrap(str, width, brk, cut) {
		brk = brk || '\n';
		width = width || 75;
		cut = cut || false;
		if (!str) {
			return str;
		}
		var regex = '.{1,' + width + '}(\\s|$)' + (cut ? '|.{' + width + '}|.+$' : '|\\S+?(\\s|$)');
		return str.match(new RegExp(regex, 'g')).join(brk);
	}
	function joinLines(string) {
		return string.replace(/\n/g, ' ');
	}
	function breakWords(string) {
		return wordWrap(joinLines(string), COLUMN_WORD_WRAP_LIMIT, '\n', false);
	}
	Kinetic.Idea = function (config) {
		var ENTER_KEY_CODE = 13,
			ESC_KEY_CODE = 27,
			self = this,
			unformattedText = joinLines(config.text),
			oldSetText,
			oldTransitionTo;
		config.text = breakWords(config.text);
		this.level = config.level;
		this.mmStyle = config.mmStyle;
		this.isSelected = false;
		this.setStyle(config);
		config.draggable = true;
		config.name = 'Idea';
		Kinetic.Text.apply(this, [config]);
		oldSetText = this.setText.bind(this);
		this.setText = function (text) {
			unformattedText = text;
			oldSetText(breakWords(text));
		};
		this.classType = 'Idea';
		this.on('dblclick dbltap', self.fire.bind(self, ':nodeEditRequested'));
		this.oldDrawFunc = this.getDrawFunc();
		this.setDrawFunc(function (canvas) {
			if (self.isVisible()) {
				if (this.mmStyle && this.mmStyle.collapsed) {
					var context = canvas.getContext(), width = this.getWidth(), height = this.getHeight();
					this.drawCollapsedBG(canvas, {x: 8, y: 8});
					this.drawCollapsedBG(canvas, {x: 4, y: 4});
				}
				this.oldDrawFunc(canvas);
			}
		});
		oldTransitionTo = this.transitionTo.bind(this);
		this.transitionTo = function (transition) {
			if (!self.isVisible()) {
				transition.duration = 0.01;
			}
			oldTransitionTo(transition);
		};
		this.getNodeAttrs = function () {
			return self.attrs;
		};
		this.drawCollapsedBG = function (canvas, offset) {
			var context = canvas.getContext(),
				cornerRadius = this.getCornerRadius(),
				width = this.getWidth(),
				height = this.getHeight();
			context.beginPath();
			if (cornerRadius === 0) {
				context.rect(offset.x, offset.y, width, height);
			} else {
				context.moveTo(offset.x + cornerRadius, offset.y);
				context.lineTo(offset.x + width - cornerRadius, offset.y);
				context.arc(offset.x + width - cornerRadius, offset.y + cornerRadius, cornerRadius, Math.PI * 3 / 2, 0, false);
				context.lineTo(offset.x + width, offset.y + height - cornerRadius);
				context.arc(offset.x + width - cornerRadius, offset.y + height - cornerRadius, cornerRadius, 0, Math.PI / 2, false);
				context.lineTo(offset.x + cornerRadius, offset.y + height);
				context.arc(offset.x + cornerRadius, offset.y + height - cornerRadius, cornerRadius, Math.PI / 2, Math.PI, false);
				context.lineTo(offset.x, offset.y + cornerRadius);
				context.arc(offset.x + cornerRadius, offset.y + cornerRadius, cornerRadius, Math.PI, Math.PI * 3 / 2, false);
			}
			context.closePath();
			canvas.fillStroke(this);
		};
		this.isVisible = function (offset) {
			var stage = self.getStage();
			return stage && stage.isRectVisible(new MAPJS.Rectangle(self.attrs.x, self.attrs.y, self.getWidth(), self.getHeight()), offset);
		};
		this.editNode = function (shouldSelectAll) {
			self.fire(':editing');
			//this only works for solid color nodes
			self.attrs.textFill = self.attrs.fill;
			self.getLayer().draw();
			var canvasPosition = jQuery(self.getLayer().getCanvas().getElement()).offset(),
				ideaInput,
				updateText = function (newText) {
					self.setStyle(self.attrs);
					self.getStage().draw();
					self.fire(':textChanged', {
						text: newText || unformattedText
					});
					ideaInput.remove();
					self.stopEditing = undefined;
					self.getStage().off('xChange yChange', onStageMoved);
				},
				onCommit = function () {
					updateText(ideaInput.val());
				},
				onCancelEdit = function () {
					updateText(unformattedText);
				},
				scale = self.getStage().getScale().x || 1,
				onStageMoved = _.throttle(function () {
					ideaInput.css({
						top: canvasPosition.top + self.getAbsolutePosition().y,
						left: canvasPosition.left + self.getAbsolutePosition().x
					});
				}, 10);
			ideaInput = jQuery('<textarea type="text" wrap="soft" class="ideaInput"></textarea>')
				.css({
					top: canvasPosition.top + self.getAbsolutePosition().y,
					left: canvasPosition.left + self.getAbsolutePosition().x,
					width: self.getWidth() * scale,
					height: self.getHeight() * scale
				})
				.val(unformattedText)
				.appendTo('body')
				.keydown(function (e) {
					if (e.which === ENTER_KEY_CODE) {
						onCommit();
					} else if (e.which === ESC_KEY_CODE) {
						onCancelEdit();
					} else if (e.which === 9) {
						e.preventDefault();
					} else if (e.which === 83 && (e.metaKey || e.ctrlKey)) {
						e.preventDefault();
						onCommit();
						return; /* propagate to let the environment handle ctrl+s */
					}
					e.stopPropagation();
				})
				.blur(onCommit)
				.focus()
				.on('input', function () {
					var text = new Kinetic.Idea({
						text: ideaInput.val()
					});
					ideaInput.width(Math.max(ideaInput.width(), text.getWidth()));
					ideaInput.height(Math.max(ideaInput.height(), text.getHeight()));
				});
			self.stopEditing = onCancelEdit;
			if (shouldSelectAll) {
				ideaInput.select();
			} else if (ideaInput[0].setSelectionRange) {
				ideaInput[0].setSelectionRange(unformattedText.length, unformattedText.length);
			}
			self.getStage().on('xChange yChange', onStageMoved);
		};
	};
}());

Kinetic.Idea.prototype.setStyle = function (config) {
	'use strict';
	var isDroppable = this.isDroppable,
		isSelected = this.isSelected,
		isRoot = this.level === 1,
		defaultBg = MAPJS.defaultStyles[isRoot ? 'root' : 'nonRoot'].background,
		offset =  (this.mmStyle && this.mmStyle.collapsed) ? 3 : 4,
		normalShadow = {
			color: 'black',
			blur: 10,
			offset: [offset, offset],
			opacity: 0.4
		},
		selectedShadow = {
			color: 'black',
			blur: 0,
			offset: [offset, offset],
			opacity: 1
		},
		validColor = function (color, defaultColor) {
			if (!color) {
				return defaultColor;
			}
			var parsed = Color(color).hexString();
			return color.toUpperCase() === parsed.toUpperCase() ? color : defaultColor;
		},
		background = validColor(this.mmStyle && this.mmStyle.background, defaultBg),
		tintedBackground = Color(background).mix(Color('#EEEEEE')).hexString(),
		luminosity = Color(tintedBackground).luminosity();
	config.strokeWidth = 1;
	config.padding = 8;
	config.fontSize = 10;
	config.fontFamily = 'Helvetica';
	config.lineHeight = 1.5;
	config.fontStyle = 'bold';
	if (isDroppable) {
		config.stroke = '#9F4F4F';
		config.fill = {
			start: { x: 0, y: 0 },
			end: {x: 0, y: 20 },
			colorStops: [0, '#EF6F6F', 1, '#CF4F4F']
		};
		background = '#EF6F6F';
	} else if (isSelected) {
		config.fill = background;
	} else {
		config.stroke = '#888';
		config.fill = {
			start: { x: 0, y: 0 },
			end: {x: 100, y: 100 },
			colorStops: [0, tintedBackground, 1, background]
		};
	}
	config.align = 'center';
	if (this.attrs && this.attrs.shadow) {
		this.setShadow(isSelected ? selectedShadow : normalShadow);
	} else {
		config.shadow = isSelected ? selectedShadow : normalShadow;
	}
	config.cornerRadius = 10;
	if (luminosity < 0.5) {
		config.textFill = '#EEEEEE';
	} else if (luminosity < 0.9) {
		config.textFill = '#4F4F4F';
	} else {
		config.textFill = '#000000';
	}
};
Kinetic.Idea.prototype.setMMStyle = function (newMMStyle) {
	'use strict';
	this.mmStyle = newMMStyle;
	this.setStyle(this.attrs);
	this.getLayer().draw();
};
Kinetic.Idea.prototype.setIsSelected = function (isSelected) {
	'use strict';
	this.isSelected = isSelected;
	this.setStyle(this.attrs);
	this.getLayer().draw();
	if (!isSelected && this.stopEditing) {
		this.stopEditing();
	}
};
Kinetic.Idea.prototype.setIsDroppable = function (isDroppable) {
	'use strict';
	this.isDroppable = isDroppable;
	this.setStyle(this.attrs);
};
Kinetic.Idea.prototype.transitionToAndDontStopCurrentTransitions = function (config) {
	'use strict';
	var transition = new Kinetic.Transition(this, config),
		animation = new Kinetic.Animation();
	animation.func = transition._onEnterFrame.bind(transition);
	animation.node = this.getLayer();
	transition.onFinished = animation.stop.bind(animation);
	transition.start();
	animation.start();
};
Kinetic.Global.extend(Kinetic.Idea, Kinetic.Text);
/*global _, Kinetic, MAPJS, Image, setTimeout, jQuery */
Kinetic.IdeaProxy = function (idea, stage, layer) {
	'use strict';
	var nodeimage,
		emptyImage,
		imageRendered,
		container = new Kinetic.Container({opacity: 0, draggable: true}),
		removeImage = function () {
			nodeimage.setImage(emptyImage);
			imageRendered = false;
		},
		cacheImage = function () {
			if (!idea.isVisible()) {
				removeImage();
				return;
			}
			if (imageRendered) {
				return;
			}
			imageRendered = true;
			var scale = stage.attrs.scale.x, x = -scale, y = -scale,
				unscaledWidth = idea.getWidth() + 20,
				unscaledHeight = idea.getHeight() + 20,
				width = (unscaledWidth * scale),
				height = (unscaledHeight * scale);
			idea.attrs.scale.x = scale;
			idea.attrs.scale.y = scale;
			idea.toImage({
				x: x,
				y: y,
				width: width,
				height: height,
				callback: function (img) {
					nodeimage.setImage(img);
					nodeimage.attrs.width = unscaledWidth;
					nodeimage.attrs.height = unscaledHeight;
					layer.draw();
				}
			});
		},
		reRender = function () {
			imageRendered = false;
			cacheImage();
		},
		nodeImageDrawFunc;
	container.attrs.x = idea.attrs.x;
	container.attrs.y = idea.attrs.y;
	idea.attrs.x = 0;
	idea.attrs.y = 0;
	nodeimage = new Kinetic.Image({
		x: -1,
		y: -1,
		width: idea.getWidth() + 20,
		height: idea.getHeight() + 20
	});
	nodeImageDrawFunc = nodeimage.getDrawFunc().bind(nodeimage);
	nodeimage.on('dblclick dbltap', idea.fire.bind(idea, ':nodeEditRequested'));

	nodeimage.setDrawFunc(function (canvas) {
		cacheImage();
		nodeImageDrawFunc(canvas);
	});

	container.add(nodeimage);


	container.getNodeAttrs = function () {
		return idea.attrs;
	};
	container.isVisible = function (offset) {
		return stage && stage.isRectVisible(new MAPJS.Rectangle(container.attrs.x, container.attrs.y, container.getWidth(), container.getHeight()), offset);
	};
	idea.isVisible = function (offset) {
		return stage && stage.isRectVisible(new MAPJS.Rectangle(container.attrs.x, container.attrs.y, container.getWidth(), container.getHeight()), offset);
	};


	idea.getLayer = function () {
		return layer;
	};
	idea.getStage = function () {
		return stage;
	};
	idea.getAbsolutePosition =  function () {
		return container.getAbsolutePosition();
	};
	stage.on(':scaleChangeComplete', function () {
		reRender();
	});
	container.transitionToAndDontStopCurrentTransitions = function (config) {
		var transition = new Kinetic.Transition(container, config),
			animation = new Kinetic.Animation();
		animation.func = transition._onEnterFrame.bind(transition);
		animation.node = container.getLayer();
		transition.onFinished = animation.stop.bind(animation);
		transition.start();
		animation.start();
	};
	_.each(['getHeight', 'getWidth'], function (fname) {
		container[fname] = function () {
			return idea && idea[fname] && idea[fname].apply(idea, arguments);
		};
	});
	_.each([':textChanged', ':editing', ':nodeEditRequested'], function (fname) {
		idea.on(fname, function (event) {
			container.fire(fname, event);
			reRender();
		});
	});
	_.each(['setMMStyle', 'setIsSelected', 'setText', 'setIsDroppable', 'editNode'], function (fname) {
		container[fname] = function () {
			var result = idea && idea[fname] && idea[fname].apply(idea, arguments);
			reRender();
			return result;
		};
	});
	return container;
};

/*global _, window, document, jQuery, Kinetic*/
var MAPJS = MAPJS || {};
if (Kinetic.Stage.prototype.isRectVisible) {
	throw ('isRectVisible already exists, should not mix in our methods');
}
MAPJS.Rectangle = function (x, y, width, height) {
	'use strict';
	this.scale = function (scale) {
		return new MAPJS.Rectangle(x * scale, y * scale, width * scale, height * scale);
	};
	this.translate = function (dx, dy) {
		return new MAPJS.Rectangle(x + dx, y + dy, width, height);
	};
	this.inset = function (margin) {
		return new MAPJS.Rectangle(x + margin, y + margin, width - (margin * 2), height - (margin * 2));
	};
	this.x = x;
	this.y = y;
	this.height = height;
	this.width = width;
};
Kinetic.Stage.prototype.isRectVisible = function (rect, offset) {
	'use strict';
	offset = offset || {x: 0, y: 0, margin: 0};
	var scale = this.getScale().x || 1;
	rect = rect.scale(scale).translate(offset.x, offset.y).inset(offset.margin);
	return !(
		rect.x + this.attrs.x > this.getWidth() ||
		rect.x + rect.width + this.attrs.x < 0  ||
		rect.y + this.attrs.y > this.getHeight() ||
		rect.y + rect.height + this.attrs.y < 0
	);
};

MAPJS.KineticMediator = function (mapModel, stage, imageRendering) {
	'use strict';
	var layer = new Kinetic.Layer(),
		nodeByIdeaId = {},
		connectorByFromIdeaId_ToIdeaId = {},
		connectorKey = function (fromIdeaId, toIdeaId) {
			return fromIdeaId + '_' + toIdeaId;
		},
		atLeastOneVisible = function (list, deltaX, deltaY) {
			var margin = Math.min(stage.getHeight(), stage.getWidth()) * 0.1;
			return _.find(list, function (node) {
				return node.isVisible({x: deltaX, y: deltaY, margin: margin});
			});
		},
		moveStage = function (deltaX, deltaY) {
			var visibleAfterMove, visibleBeforeMove;
			if (!stage) {
				return;
			}
			visibleBeforeMove = atLeastOneVisible(nodeByIdeaId, 0, 0) || atLeastOneVisible(connectorByFromIdeaId_ToIdeaId, 0, 0);
			visibleAfterMove = atLeastOneVisible(nodeByIdeaId, deltaX, deltaY) || atLeastOneVisible(connectorByFromIdeaId_ToIdeaId, deltaX, deltaY);
			if (visibleAfterMove || (!visibleBeforeMove)) {
				if (deltaY !== 0) { stage.attrs.y += deltaY; }
				if (deltaX !== 0) { stage.attrs.x += deltaX; }
				stage.draw();
			}
		},
		getTargetShape = function (evt) {
			var is;
			if (evt.offsetX && evt.offsetY) {
				is = stage.getIntersection({x: evt.offsetX, y: evt.offsetY});
				return is && is.shape;
			}
			return false;
		},
		resetStage = function () {
			stage.transitionTo({
				x: 0.5 * stage.getWidth(),
				y: 0.5 * stage.getHeight(),
				scale: {
					x: 1,
					y: 1
				},
				duration: 0.5,
				easing: 'ease-in-out'
			});
		},
		resetstageOnClick = function (evt) {
			if (!getTargetShape(evt)) {
				resetStage();
			}
		},
		stageCenteringEvents = function (isInputEnabled) {
			jQuery(document)[isInputEnabled ? 'on' : 'off']('dblclick', stage.simulate.bind(stage, 'dblclick'));
			stage[isInputEnabled ? 'on' : 'off']('dbltap dblclick', resetstageOnClick);
		};

	stage.add(layer);
	mapModel.addEventListener('inputEnabledChanged', stageCenteringEvents);
	stageCenteringEvents(true);
	mapModel.addEventListener('nodeCreated', function (n) {
		var node = new Kinetic.Idea({
			level: n.level,
			x: n.x,
			y: n.y,
			text: n.title,
			mmStyle: n.style,
			opacity: 1
		});

		if (imageRendering) {
			node = Kinetic.IdeaProxy(node, stage, layer);
		}
		/* in kinetic 4.3 cannot use click because click if fired on dragend */
		node.on('click tap', mapModel.selectNode.bind(mapModel, n.id));
		node.on('dragstart', function () {
			node.moveToTop();
			node.getNodeAttrs().shadow.offset = {
				x: 8,
				y: 8
			};
		});
		node.on('dragmove', function () {
			mapModel.nodeDragMove(
				n.id,
				node.attrs.x,
				node.attrs.y
			);
		});
		node.on('dragend', function () {
			node.getNodeAttrs().shadow.offset = {
				x: 4,
				y: 4
			};
			mapModel.nodeDragEnd(
				n.id,
				node.attrs.x,
				node.attrs.y
			);
			if (n.level > 1) {
				stage.setDraggable(true);
			}
		});
		node.on(':textChanged', function (event) {
			mapModel.updateTitle(n.id, event.text);
			mapModel.dispatchEvent('inputEnabledChanged', true);
		});
		node.on(':editing', function () {
			mapModel.dispatchEvent('inputEnabledChanged', false);
		});
		node.on(':nodeEditRequested', mapModel.editNode.bind(mapModel, 'mouse', false));

		if (n.level > 1) {
			node.on('mouseover touchstart', stage.setDraggable.bind(stage, false));
			node.on('mouseout touchend', stage.setDraggable.bind(stage, true));

		}
		layer.add(node);
		node.transitionToAndDontStopCurrentTransitions({
			opacity: 1,
			duration: 0.4
		});

		mapModel.addEventListener('nodeEditRequested:' + n.id, node.editNode);
		nodeByIdeaId[n.id] = node;

	});
	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		var node = nodeByIdeaId[ideaId],
			scale = stage.getScale().x || 1,
			offset = 100,
			move = { x: 0, y: 0 };
		node.setIsSelected(isSelected);
		if (!isSelected) {
			return;
		}
		if (node.getAbsolutePosition().x + node.getWidth() * scale + offset > stage.getWidth()) {
			move.x = stage.getWidth() - (node.getAbsolutePosition().x + node.getWidth() * scale + offset);
		} else if (node.getAbsolutePosition().x < offset) {
			move.x  = offset - node.getAbsolutePosition().x;
		}
		if (node.getAbsolutePosition().y + node.getHeight() * scale + offset > stage.getHeight()) {
			move.y = stage.getHeight() - (node.getAbsolutePosition().y + node.getHeight() * scale + offset);
		} else if (node.getAbsolutePosition().y < offset) {
			move.y = offset - node.getAbsolutePosition().y;
		}
		stage.transitionTo({
			x: stage.attrs.x + move.x,
			y: stage.attrs.y + move.y,
			duration: 0.4,
			easing: 'ease-in-out'
		});
	});
	mapModel.addEventListener('nodeStyleChanged', function (n) {
		var node = nodeByIdeaId[n.id];
		node.setMMStyle(n.style);
	});
	mapModel.addEventListener('nodeDroppableChanged', function (ideaId, isDroppable) {
		var node = nodeByIdeaId[ideaId];
		node.setIsDroppable(isDroppable);
	});
	mapModel.addEventListener('nodeRemoved', function (n) {
		var node = nodeByIdeaId[n.id];
		delete nodeByIdeaId[n.id];
		node.transitionTo({
			opacity: 0.25,
			duration: 0.4,
			callback: node.remove.bind(node)
		});
		node.off('click dblclick tap dragstart dragmove dragend mouseover mouseout :textChanged :nodeEditRequested');
		mapModel.removeEventListener('nodeEditRequested:' + n.id, node.editNode);
	});
	mapModel.addEventListener('nodeMoved', function (n, reason) {
		var node = nodeByIdeaId[n.id];
		node.transitionTo({
			x: n.x,
			y: n.y,
			duration: 0.4,
			easing: reason === 'failed' ? 'bounce-ease-out' : 'ease-in-out'
		});
	});
	mapModel.addEventListener('nodeTitleChanged', function (n) {
		var node = nodeByIdeaId[n.id];
		node.setText(n.title);
		layer.draw();
	});
	mapModel.addEventListener('connectorCreated', function (n) {
		var connector = new Kinetic.Connector({
			shapeFrom: nodeByIdeaId[n.from],
			shapeTo: nodeByIdeaId[n.to],
			stroke: '#888',
			strokeWidth: 1,
			opacity: 0
		});
		connector.opacity = 0;
		connectorByFromIdeaId_ToIdeaId[connectorKey(n.from, n.to)] = connector;
		layer.add(connector);
		connector.moveToBottom();
		connector.transitionTo({
			opacity: 1,
			duration: 0.4
		});
	});
	mapModel.addEventListener('connectorRemoved', function (n) {
		var key = connectorKey(n.from, n.to),
			connector = connectorByFromIdeaId_ToIdeaId[key];
		delete connectorByFromIdeaId_ToIdeaId[key];
		connector.transitionTo({
			opacity: 0,
			duration: 0.1,
			callback: connector.remove.bind(connector)
		});
	});
	mapModel.addEventListener('mapScaleChanged', function (scaleMultiplier, zoomPoint) {
		var currentScale = stage.getScale().x || 1,
			targetScale = Math.max(Math.min(currentScale * scaleMultiplier, 5), 0.2);
		if (currentScale === targetScale) {
			return;
		}
		zoomPoint = zoomPoint || {x:  0.5 * stage.getWidth(), y: 0.5 * stage.getHeight()};
		stage.transitionTo({
			scale: {
				x: targetScale,
				y: targetScale
			},
			x: zoomPoint.x + (stage.attrs.x - zoomPoint.x) * targetScale / currentScale,
			y: zoomPoint.y + (stage.attrs.y - zoomPoint.y) * targetScale / currentScale,
			duration: 0.1,
			easing: 'ease-in-out',
			callback: function () {
				if (imageRendering) {
					stage.fire(':scaleChangeComplete');
				}
			}
		});
	});
	mapModel.addEventListener('mapViewResetRequested', function () {
		resetStage();
	});
	mapModel.addEventListener('mapMoveRequested', function (deltaX, deltaY) {
		moveStage(deltaX, deltaY);
	});
	(function () {
		var x, y;
		stage.on('dragmove', function () {
			var deltaX = x - stage.attrs.x,
				deltaY = y - stage.attrs.y,
				visibleAfterMove = atLeastOneVisible(nodeByIdeaId, 0, 0) || atLeastOneVisible(connectorByFromIdeaId_ToIdeaId, 0, 0),
				shouldMoveBack = !visibleAfterMove && !(atLeastOneVisible(nodeByIdeaId, deltaX, deltaY) || atLeastOneVisible(connectorByFromIdeaId_ToIdeaId, deltaX, deltaY));
			if (shouldMoveBack) {
				moveStage(deltaX, deltaY);
			} else {
				x = stage.attrs.x;
				y = stage.attrs.y;
			}
		});
	}());
	(function () {
		var keyboardEventHandlers = {
			13: mapModel.addSiblingIdea.bind(mapModel, 'keyboard'),
			8: mapModel.removeSubIdea.bind(mapModel, 'keyboard'),
			9: mapModel.addSubIdea.bind(mapModel, 'keyboard'),
			37: mapModel.selectNodeLeft.bind(mapModel, 'keyboard'),
			38: mapModel.selectNodeUp.bind(mapModel, 'keyboard'),
			39: mapModel.selectNodeRight.bind(mapModel, 'keyboard'),
			40: mapModel.selectNodeDown.bind(mapModel, 'keyboard'),
			46: mapModel.removeSubIdea.bind(mapModel, 'keyboard'),
			32: mapModel.editNode.bind(mapModel, 'keyboard'),
			191: mapModel.toggleCollapse.bind(mapModel, 'keyboard'),
			67: mapModel.cut.bind(mapModel, 'keyboard'),
			80: mapModel.paste.bind(mapModel, 'keyboard'),
			89: mapModel.copy.bind(mapModel, 'keyboard'),
			85: mapModel.undo.bind(mapModel, 'keyboard')
		}, shiftKeyboardEventHandlers = {
			9: mapModel.insertIntermediate.bind(mapModel, 'keyboard'),
			38: mapModel.toggleCollapse.bind(mapModel, 'keyboard')
		}, metaKeyboardEventHandlers = {
			48: resetStage,
			90: mapModel.undo.bind(mapModel, 'keyboard'),
			89: mapModel.redo.bind(mapModel, 'keyboard'),
			187: mapModel.scaleUp.bind(mapModel, 'keyboard'),
			189: mapModel.scaleDown.bind(mapModel, 'keyboard'),
			38: mapModel.moveRelative.bind(mapModel, 'keyboard', -1),
			40: mapModel.moveRelative.bind(mapModel, 'keyboard', 1),
			88: mapModel.cut.bind(mapModel, 'keyboard'),
			67: mapModel.copy.bind(mapModel, 'keyboard'),
			86: mapModel.paste.bind(mapModel, 'keyboard')
		},
			onKeydown = function (evt) {
				var eventHandler = ((evt.metaKey || evt.ctrlKey) ? metaKeyboardEventHandlers :
						(evt.shiftKey ? shiftKeyboardEventHandlers : keyboardEventHandlers))[evt.which];
				if (eventHandler) {
					eventHandler();
					evt.preventDefault();
				}
			},
			onScroll = function (event, delta, deltaX, deltaY) {
				moveStage(-1 * deltaX, deltaY);
				if (event.preventDefault) { // stop the back button
					event.preventDefault();
				}
			};
		jQuery(window).mousewheel(onScroll);
		mapModel.addEventListener('inputEnabledChanged', function (isInputEnabled) {
			jQuery(document)[isInputEnabled ? 'bind' : 'unbind']('keydown', onKeydown);
			jQuery(window)[isInputEnabled ? 'mousewheel' : 'unmousewheel'](onScroll);
		});
		jQuery(document).keydown(onKeydown);
	}());
};
MAPJS.KineticMediator.dimensionProvider = _.memoize(function (title) {
	'use strict';
	var text = new Kinetic.Idea({
		text: title
	});
	return {
		width: text.getWidth(),
		height: text.getHeight()
	};
});
MAPJS.KineticMediator.layoutCalculator = function (idea) {
	'use strict';
	return MAPJS.calculateLayout(idea, MAPJS.KineticMediator.dimensionProvider);
};
/*global jQuery*/
/*jslint es5: true*/
jQuery.fn.mapToolbarWidget = function (mapModel) {
	'use strict';
	var clickMethodNames = ['insertIntermediate', 'scaleUp', 'scaleDown', 'addSubIdea', 'editNode', 'removeSubIdea', 'toggleCollapse', 'addSiblingIdea', 'undo', 'redo',
			'copy', 'cut', 'paste', 'resetView'],
		changeMethodNames = ['updateStyle'];
	return this.each(function () {
		var element = jQuery(this);
		mapModel.addEventListener('nodeSelectionChanged', function () {
			element.find('.updateStyle[data-mm-target-property]').val(function () {
				return mapModel.getSelectedStyle(jQuery(this).data('mm-target-property'));
			}).change();
		});
		clickMethodNames.forEach(function (methodName) {
			element.find('.' + methodName).click(function () {
				if (mapModel[methodName]) {
					mapModel[methodName]('toolbar');
				}
			});
		});
		changeMethodNames.forEach(function (methodName) {
			element.find('.' + methodName).change(function () {
				var tool = jQuery(this);
				if (tool.data('mm-target-property')) {
					mapModel[methodName]('toolbar', tool.data('mm-target-property'), tool.val());
				}
			});
		});
	});
};
/*jslint nomen: true*/
/*global _, jQuery, MAPJS, Kinetic, observable */
MAPJS.PNGExporter = function (mapRepository) {
	'use strict';
	var self = this, idea;
	observable(this);
	mapRepository.addEventListener('mapLoaded', function (anIdea) {
		idea = anIdea;
	});
	this.exportMap = function () {
		var layout = MAPJS.calculateLayout(idea, MAPJS.KineticMediator.dimensionProvider),
			frame = MAPJS.calculateFrame(layout.nodes, 10),
			hiddencontainer = jQuery('<div></div>').css('visibility', 'hidden')
				.appendTo('body').width(frame.width).height(frame.height).attr('id', 'hiddencontainer'),
			hiddenstage = new Kinetic.Stage({ container: 'hiddencontainer' }),
			layer = new Kinetic.Layer(),
			backgroundLayer = new Kinetic.Layer(),
			nodeByIdeaId = {},
			bg = new Kinetic.Rect({
				fill: '#ffffff',
				x: frame.left,
				y: frame.top,
				width: frame.width,
				height: frame.height
			});
		hiddenstage.add(backgroundLayer);
		backgroundLayer.add(bg);
		hiddenstage.add(layer);
		hiddenstage.setWidth(frame.width);
		hiddenstage.setHeight(frame.height);
		hiddenstage.attrs.x = -1 * frame.left;
		hiddenstage.attrs.y = -1 * frame.top;
		_.each(layout.nodes, function (n) {
			var node = new Kinetic.Idea({
				level: n.level,
				x: n.x,
				y: n.y,
				text: n.title,
				mmStyle: n.style
			});
			nodeByIdeaId[n.id] = node;
			layer.add(node);
		});
		_.each(layout.connectors, function (n) {
			var connector = new Kinetic.Connector({
				shapeFrom: nodeByIdeaId[n.from],
				shapeTo: nodeByIdeaId[n.to],
				stroke: '#888',
				strokeWidth: 1
			});
			layer.add(connector);
			connector.moveToBottom();
		});
		hiddenstage.draw();
		hiddenstage.toDataURL({
			callback: function (url) {
				self.dispatchEvent('mapExported', url);
				hiddencontainer.remove();
			}
		});
	};
};
/*global jQuery, Kinetic, MAPJS, window*/
jQuery.fn.mapWidget = function (activityLog, mapModel, touchEnabled, imageRendering) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this),
			stage = new Kinetic.Stage({
				container: 'container',
				draggable: true
			}),
			mediator = new MAPJS.KineticMediator(mapModel, stage, imageRendering),
			setStageDimensions = function () {
				stage.setWidth(element.width());
				stage.setHeight(element.height());
				stage.draw();
			},
			simulateTouch = function (touchType, hammerEvent) {
				var center;
				if (!hammerEvent.gesture) {
					return; // not a hammer event, instead simulated doubleclick
				}
				center = hammerEvent.gesture.center;
				stage.simulate(touchType, {
					offsetX: center.pageX - element.offset().left,
					offsetY: center.pageY - element.offset().top
				});
			},
			lastGesture,
			discrete = function (gesture) {
				var result = (lastGesture && lastGesture.type !== gesture.type && (gesture.timeStamp - lastGesture.timeStamp < 250));
				lastGesture = gesture;
				return !result;
			};
		activityLog.log('Creating canvas Size ' + element.width() + ' ' + element.height());
		setStageDimensions();
		stage.attrs.x = 0.5 * stage.getWidth();
		stage.attrs.y = 0.5 * stage.getHeight();
		//stage.attrs.y = Math.max(-minY + $('#topbar').outerHeight() + 5, 0.5 * stage.getHeight());
		jQuery(window).resize(setStageDimensions);
		jQuery('.modal')
			.on('show', mapModel.setInputEnabled.bind(mapModel, false))
			.on('hidden', mapModel.setInputEnabled.bind(mapModel, true));
		if (touchEnabled) {
			element.find('canvas').hammer().on("pinch", function (event) {
				if (discrete(event)) {
					mapModel.scale('touch', event.gesture.scale, {
						x: event.gesture.center.pageX - element.offset().left,
						y: event.gesture.center.pageY - element.offset().top
					});
				}
			}).on("swipe", function (event) {
				if (discrete(event)) {
					mapModel.move('touch', event.gesture.deltaX, event.gesture.deltaY);
				}
			}).on("doubletap", function (event) {
				simulateTouch("dbltap", event);
			}).on("touch", function (evt) {
				jQuery('.topbar-color-picker:visible').hide();
				jQuery('.ideaInput:visible').blur();
			});
		}
	});
};
