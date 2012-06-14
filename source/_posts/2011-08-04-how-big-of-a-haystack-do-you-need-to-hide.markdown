---
date: '2011-08-04 18:13:17'
layout: post
type: blog
slug: how-big-of-a-haystack-do-you-need-to-hide
status: publish
title: How big of a haystack do you need to hide?
wordpress_id: '47'
comments: true
categories:
- Digital Self
- Entropy
- Information
keywords: "Entropy, entropy of information, browser identity, Deepak Kandepet, Kandepet"
description: "Every fact you learn about a person reduces the entropy of their identity. Find out how information gathered from your browser can uniquely identify you"
---

Every fact you learn about a person reduces the "entropy" of their identity. For e.g.







  * If I know your gender, we can eliminate about 50% of the population: There were about 155.6 million females & 151.4 million males in the United States in 2009.


  * If I know your birthday we can eliminate a much larger percentage of the population: At age 85 and older, there were more than twice as many women as men. People under 20 years of age made up over a quarter of the U.S. population (27.3%), and people age 65 and over made up one-eighth (12.8%) in 2009.


  * We can narrow you down even more if we know your zip code




Each of these facts independently narrow down the population, so much so that the combination of gender, ZIP code, birth date was [unique for about 63% of the U.S](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.91.4147&rep=rep1&type=pdf). population.





### Lets see how this works:




Every time we learn a new fact about a person, there is less uncertainty about that person. Remember, entropy is a measure of this uncertainty. When we learn a new fact about a person, that fact reduces the entropy of their identity by a certain amount. There is a formula to say how much:




ΔS = -ln Pr(X=x)




Where ΔS is the reduction in entropy, measured in bits and Pr(X=x) is simply the probability that the fact would be true of a random person. Let's apply the formula to a few facts, just for fun:




Starsign: ΔS = -ln Pr(STARSIGN=capricorn) = -ln (1/12) = 3.58 bits of information
Birthday: ΔS = -ln Pr(DOB=2nd of January) = -ln (1/365) = 8.51 bits of information




In the examples above, each starsign and birthday was assumed to be equally likely. The calculation can also be applied to facts which have non-uniform likelihoods. For instance, the likelihood that an unknown person's ZIP code is 90210 (Beverley Hills, California) is different to the likelihood that their ZIP code would be 40203 (part of Louisville, Kentucky). As of 2007, there were 21,733 people living in the 90210 area, only 452 in 40203, and around 6.625 billion on the planet.




Knowing my ZIP code is 90210: ΔS = -ln (21,733/6,625,000,000) = 18.21 bits
Knowing my ZIP code is 40203: ΔS = -ln (452/6,625,000,000) = 23.81 bits
Knowing that I live in Moscow: ΔS = -ln (10524400/6,625,000,000) = 9.30 bits




How much entropy is needed to identify someone?




As of 2007, identifying someone from the entire population of the planet required:




S = ln (1/6625000000) = 32.6 bits of information.




Conservatively, we can round that up to 33 bits.




So for instance, if we know someone's birthday, and we know their ZIP code is 40203, we have 8.51 + 23.81 = 32.32 bits; that's almost, but perhaps not quite, enough to know who they are: there might be a couple of people who share those characteristics. Add in their gender, that's 33.32 bits, and we can probably say exactly who the person is.




So, in the end if we are all just 33 bits, This is me: 000000010101101101000010101001111




P.S. Challenge: Decode this:  000000010101101101000010101001111
