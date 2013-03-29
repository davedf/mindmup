# forked from sinatra-support
# Original copyright (c) 2009-2011 Cyril David, Rico Sta. Cruz and Sinefunc, Inc.
#
# == Usage
#
#   register Sinatra::UserAgentHelpers
#
# == Example
#
# After you have registered the UserAgentHelpers, use the {#browser} helper to
# check for features:
#
#   <% if browser.ios? %>
#     <p>Download our mobile app!</p>
#   <% end %>
#
# Or use the #body_class method:
#
#   <body class="<%= browser.body_class %>">
#
# The above line can have an output like so:
#
#   <body class="webkit safari mac">
#   <body class="windows ie ie6">
#
# == Helper
#
#   #browser -- provides the browser helper. Refer to the {UserAgent} class
#   for more info.
#

module Sinatra::UserAgentHelpers
  def browser
    UserAgent.new(env['HTTP_USER_AGENT'] || '')
  end
end

class UserAgent
  UA_REGEXP = %r{([^ /]+)/([^ ]+)(?: \(([^)]+)\))?}

  def initialize(ua)
    @ua_string = ua
    @ua = ua.scan(UA_REGEXP).map { |r|
      r[2] = r[2].split(';').map { |s| s.strip }  unless r[2].nil?
      { :product => r[0], :version => r[1], :details => r[2] }
    }
  end

  # Browsers
  def webkit?()    product?('AppleWebKit'); end
  def chrome?()    product?('Chrome'); end
  def safari?()    product?('Safari') && !chrome?; end
  def ios?()       (product?('Safari') && product?('Mobile')) || detail?(/^iPad/, 'Mozilla') || detail?(/^iPhone/, 'Mozilla'); end # when using meta apple-mobile-web-app-capable, "Safari" will not be set
  def gecko?()     product?('Gecko'); end
  def opera?()     product?('Opera'); end
  def ie?()        detail?(/^MSIE/, 'Mozilla'); end

  # OS's and devices
  def linux?()     detail?(/^Linux/, 'Mozilla'); end
  def iphone?()    detail?(/^iPhone/, 'Mozilla'); end
  def rim?()       detail?(/^Blackberry/, 'Mozilla'); end
  def android?()   detail?(/^Android/, 'Mozilla'); end
  def android1?()  detail?(/^Android 1\./, 'Mozilla'); end
  def android2?()  detail?(/^Android 2\./, 'Mozilla'); end
  def nokia?()     detail?(/^Nokia/, 'Mozilla') || detail?(/^Series[38]0/, 'Mozilla'); end
  def ipad?()      detail?(/^iPad/, 'Mozilla'); end
  def windows?()   detail?(/^Windows/, 'Mozilla'); end
  def osx?()       detail?(/^(Intel )?Mac OS X/, 'Mozilla'); end
  def mac?()       detail?(/^Macintosh/, 'Mozilla') || osx?; end
  def blackberry?() detail?(/^Blackberry/, 'Mozilla'); end

  # IE
  def ie9?()       detail?('MSIE 9.0', 'Mozilla'); end
  def ie8?()       detail?('MSIE 8.0', 'Mozilla'); end
  def ie7?()       detail?(/^MSIE 7.0/, 'Mozilla'); end
  def ie6?()       detail?(/^MSIE 6/, 'Mozilla'); end

  # Different Firefox versions
  def gecko40?()   gecko_version?(20100401, 20110101); end
  def gecko36?()   gecko_version?(20091111, 20100401); end
  def gecko35?()   gecko_version?(20090612, 20091111); end
  def gecko30?()   gecko_version?(20080610, 20090612); end
  def gecko20?()   gecko_version?(20061010, 20080610); end
  def gecko_old?() gecko_version?(0, 20061010); end

  def gecko_version?(from, to)
    g = product('Gecko')
    return nil  if g.nil?
    v = g[:version][0...8].to_i
    (v >= from) and (v < to)
  end

  # Returns the list of applicable browser features.
  #
  # == Examples
  #
  #   <body class="<%= browser.body_class %>">
  #
  # This can return one of the following:
  #
  #   <body class="ios webkit ipad">
  #   <body class="chrome linux webkit">
  #   <body class="gecko linux">
  #   <body class="windows ie ie6">
  #
  def body_class
    (%w(webkit chrome safari ios gecko opera ie linux) +
     %w(blackberry nokia android iphone) +
     %w(gecko36 gecko35 gecko30 gecko20 gecko_old) +
     %w(ipad windows osx mac ie6 ie7 ie8 ie9)).map do |aspect|
      aspect  if self.send :"#{aspect}?"
    end.compact.join(' ')
  end
private
  def to_s()       @ua_string; end
  def inspect()    @ua.inspect; end

  # Checks for, say, 'Gecko' in 'Gecko/3.9.82'
  def product?(str)
    !! product(str)
  end

  def product(str)
    @ua.detect { |p| p[:product] == str }
  end

  # Checks for, say, 'MSIE' in 'Mozilla/5.0 (MSIE; x; x)'
  def detail?(detail, prod=nil)
    !! @ua.detect { |p|
      prod.nil? || prod == p[:product] && has_spec(p[:details], detail)
    }
  end

  def has_spec(haystack, spec)
    !haystack.nil? && haystack.detect { |d| d.match(spec) }
  end
end

