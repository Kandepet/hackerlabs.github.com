# Title: Simple Image tag for Jekyll
# Authors: Brandon Mathis http://brandonmathis.com
#          Felix Schäfer, Frederic Hemberger
# Description: Easily output images with optional class names, width, height, title and alt attributes
#
# Syntax {% img [class name(s)] [http[s]:/]/path/to/image [width [height]] [title text | "title text" ["alt text"]] %}
#
# Examples:
# {% cimg /images/ninja.png Ninja Attack! %}
# {% cimg left half http://site.com/images/ninja.png Ninja Attack! %}
# {% cimg left half http://site.com/images/ninja.png 150 150 "Ninja Attack!" "Ninja in attack posture" %}
#
# Output:
# <img src="/images/ninja.png">
# <span class='caption-wrapper'><img class="left half" src="http://site.com/images/ninja.png" title="Ninja Attack!" alt="Ninja Attack!"><span class='caption-text'>Ninja Attack</span></span>
# <span class='caption-wrapper'><img class="left half" src="http://site.com/images/ninja.png" width="150" height="150" title="Ninja Attack!" alt="Ninja in attack posture"><span class='caption-text'>Ninja Attack</span></span>
#

module Jekyll

  class CaptionedImageTag < Liquid::Tag
    @img = nil

    def initialize(tag_name, markup, tokens)
      attributes = ['class', 'src', 'width', 'height', 'title']

      if markup =~ /(?<class>\S.*\s+)?(?<src>(?:https?:\/\/|\/|\S+\/)\S+)(?:\s+(?<width>\d+))?(?:\s+(?<height>\d+))?(?<title>\s+.+)?/i
        @img = attributes.reduce({}) { |img, attr| img[attr] = $~[attr].strip if $~[attr]; img }
        if /(?:"|')(?<title>[^"']+)?(?:"|')\s+(?:"|')(?<alt>[^"']+)?(?:"|')/ =~ @img['title']
          @img['title']  = title
          @img['alt']    = alt
        else
          @img['alt']    = @img['title'].gsub!(/"/, '&#34;') if @img['title']
        end
        @img['class'].gsub!(/"/, '') if @img['class']
      end
      super
    end

    def render(context)
      if @img
         if @img['title']
            "<span class='caption-wrapper'><img #{@img.collect {|k,v| "#{k}=\"#{v}\"" if v}.join(" ")}><span class='caption-text'>#{@img['title']}</span></span>"
         else
            "<img #{@img.collect {|k,v| "#{k}=\"#{v}\"" if v}.join(" ")}>"
         end
      else
        "Error processing input, expected syntax: {% img [class name(s)] [http[s]:/]/path/to/image [width [height]] [title text | \"title text\" [\"alt text\"]] %}"
      end
    end
  end
end

Liquid::Template.register_tag('cimg', Jekyll::CaptionedImageTag)
