breed [democrats democrat]
breed [republicans republican]
breed [city-centers city-center]

patches-own [
  seed?  ;;district seed
  district  ;;district number
  full? ;;is the district at capacity?
  enclave
  cluster ;;identifies clusters of single districts to remove noncontiguous small portions
  border? ;;finds borders of districts to outline districts
  d-win? ;;did the dem win the district?
  tie?  ;;was it a tie?
  packed?
  cracked?
  proportion-dem ;;proportion of dems for packed districts
]

globals [
  total-dems-to-make ;; number of dems left to create
  total-gops-to-make ;;number of gops left to create
  city-dems ;;number of dems, split to make cities
  city-gops ;;number of gops, split to make cities
  votes
  d-reps ;;number of districts won by dems
  r-reps ;;number of districts won by gop
  ties ;;number of tied districts
  total-enclaves
  total-clusters ;;number of clusters counted at each iteration
  ties-to-wins ;;how many districts tie that become dem-wins
  dem-wins-list ;;appends each number of dem districts with each redistricting of the same population
  gerrymander-results ;;number of dem districts won when gerrymander clicked
  total-ties
  total-ties-to-wins
  color-list ;;list of distinct colors
  user-specified-proportion ;;the proportion of maps that gave the user's specified number of d-reps
  user-specified-dem-districts-won ;;the number of dem districts the user chose to check
  num-maps-made ;;number of maps made in the process
  reseed? ;;if true, run the seed-district process again (when multiple maps are being generated)
  num-packed ;;current number of packed districts
  dems-packed ;;number of dems in packed districts
  dem-split ;; approx number of dems to split over remaining cracked districts
  tries;; number of attempts before remaking packed districts
  total-packed ;;total number of packed districts to make
  packed-proportion-threshold ;;proportion needed to consider a district packed
  equal-population-error ;; percent increase/decrease to consider populations equal enough
]

to setup
  clear-all
  set total-dems-to-make (round num-voters * (dem-percentage / 100))
  set total-gops-to-make (round num-voters * (1 - (dem-percentage / 100)))
  generate-cities
  create-democrats total-dems-to-make [ ;;uniformly distribute rest of dems (total/(2^n))
    set color blue
    setxy random-xcor random-ycor
    set shape "person"
  ]
  create-republicans total-gops-to-make [
    set color red
    setxy random-xcor random-ycor
    set shape "person"
  ]
  while [ any? patches with [ count turtles-here >= 0.25 * (count turtles) / num-districts ] ] [  ;;make sure cities aren't too dense to make districts
    ask turtles [
      rt random 360 fd random 3
    ]
  ]
  set dem-wins-list []
  set gerrymander-results []
  set total-ties 0
  set total-ties-to-wins 0
  set num-maps-made 1
  set reseed? true
  set user-specified-dem-districts-won round (num-districts * dem-percentage / 100)
  set tries 0
  set packed-proportion-threshold 0.9 ;;lower makes for shorter time to make districts - higher obviously better
  set equal-population-error 0.15 ;;+/-15% population quota ok for districts
end

to generate-cities
  set city-dems total-dems-to-make
  set city-gops total-gops-to-make / 2 ;;leave half of gops for non-cities
  let city-num 0
  repeat num-cities [
    let center-x random-xcor / 1.5 ;;keep cities away from edges
    let center-y random-ycor / 1.5
    ask patch center-x center-y [
      while [ any? city-centers in-radius (4 * (0.9) ^ (city-num)) ] [ ;;check for other cities nearby
        set center-x random-xcor / 1.5
        set center-y random-ycor / 1.5
      ]
    ]
      create-city-centers 1 [
      setxy center-x center-y
      set shape "star"
      set color white
      set size 0.85 ^ (city-num) ;;reduce the size of the star to indicate smaller cities
    ]
    set city-dems round (city-dems / 2) ;;something like Zipf's law that says cities get smaller with their rank
    set total-dems-to-make total-dems-to-make - city-dems
    create-democrats city-dems [
      setxy center-x center-y
      set heading random 360
      jump random-exponential 3 * (0.9) ^ (city-num) ;;reduce area of city (but not by as much) and population
      set color blue
      set shape "person"
    ]
    set city-gops round (city-gops / 2)
    set total-gops-to-make total-gops-to-make - city-gops
    create-republicans city-gops [
      setxy center-x center-y
      set heading random 360
      jump random-exponential 4 * (0.9) ^ (city-num)  ;;gops spread out further
      set color red
      set shape "person"
    ]
    set city-num city-num + 1
  ]
end

to gerrymander
  let min-packed 0
  ifelse count democrats > count republicans
  [ set min-packed (count democrats - count republicans) * num-districts / num-voters ]
  [ set min-packed 0 ]
  let max-packed count democrats * num-districts / num-voters
  set total-packed round ((max-packed + min-packed) / 2)
  if reseed? [
    district-seed
    set reseed? false
    set tries 0
  ]
  let d-num 1
  set num-packed 0
  while [d-num <= num-districts]
  [
    if any? patches with [district = d-num and packed? = true] [
      set num-packed num-packed + 1
    ]
    set d-num d-num + 1
  ]
  if tries > 1000 [
    if any? patches with [packed? = true] [
      ask n-of round (count patches with [packed? = true] / 4) patches with [packed? = true] [undistrict]
      ask patches with [packed? = true] [ set full? false]
    ]
    set num-packed 0
    set tries 0
  ]
  while [ num-packed < total-packed or any? patches with [packed? = true and full? = false]] [
    create-packed-district  ;;make packed district first, then don't touch it
    set tries 0
  ]
  make-cracked-districts ;;builds districts by attempting to pack or crack
  fill-holes
  find-clusters
  release-noncontiguous-portions
  if (all? patches with [district > 0] [full? = true]) [ district-leftovers ] ;;fill in turtle-less black patches or gop stuck inside packed hole if that's all that's left
  check-district-count ;; checks for capacity, if it's too big, and if a district has been completely swallowed up
  set tries tries + 1
  if all? patches [ full? = true and (packed? = true or cracked? = true) ] [ ;;finishing steps for stuff to look nice and make final calculations
    identify-dem-wins ;;counts d-reps and sets d-win? to true, also flips for wins if tied
    identify-gop-wins ;;counts r-reps and sets d-win? to false
    recolor-districts ;;recolor to indicate winner and create borders around districts
    label-districts
    display
    if only-district-maps? = false [ wait 0.7 ]
    set gerrymander-results insert-item 0 gerrymander-results d-reps ;;list of districts won by gerrymandering against dems for histogram
    update-plots
    set total-ties total-ties + ties
    set total-ties-to-wins total-ties-to-wins + ties-to-wins
    set reseed? true
    set num-packed 0
    if only-district-maps? = false [ reset-ticks ]
    ifelse num-maps-made < num-maps
    [
      set num-maps-made num-maps-made + 1
      set reseed? true
    ]
    [
      set num-maps-made 1
      set reseed? true
      stop
    ]
  ]

  if only-district-maps? = false [ tick ]
end

to create-packed-district
  let d-num 1
  set num-packed 0
  while [d-num <= num-districts]
  [
    if any? patches with [district = d-num and packed? = true] [ ;;counts how many packed districts there are
      set num-packed num-packed + 1
    ]
    if num-packed > total-packed [
      ask patches with [district = d-num] [ undistrict ] ;;if too many, take them away
    ]
    set d-num d-num + 1
  ]
  check-district-count
  while [num-packed < total-packed] [ ;;make more packed districts if they dissolve
    ask n-of (total-packed - num-packed) patches with [district > 0 and packed? = false] [
      set packed? true
    ]
    set d-num 1
    while [d-num <= num-districts]
    [
      if any? patches with [district = d-num and packed? = true] [
        set num-packed num-packed + 1
      ]
      set d-num d-num + 1
    ]
  ]
  set d-num 1
  while [d-num <= num-districts] [
    while [not all? patches with [district = d-num and packed? = true ] [full? = true and proportion-dem >= packed-proportion-threshold]] [ ;;continue growing until district is full and proportion of dems is too low
      ifelse any? patches with [district = d-num and packed? = true] [ ;;finds closest dem to packed district (seems like closest to random patch works better)
        ask one-of patches with [district = d-num and packed? = true] [ salamander ]
      ]
      [ ask one-of patches with [packed? = false and district > 0] [set packed? true] ]
      ask patches with [district = d-num and packed? = true] [
        ifelse any? turtles with [district = d-num]
        [
          set proportion-dem (dem-votes d-num) / (count turtles with [district = d-num])
        ]
        [ set proportion-dem 0 ]
        if count turtles with [district = d-num] >= (1 + equal-population-error) * (count turtles) / num-districts  [ ;;if turtle count too far above quota, give up all republicans
          ask n-of ((count republicans-on patches with [district = d-num and not any? democrats-here]) / 1) republicans-on patches with [district = d-num and not any? democrats-here] ;;remove half of district randomly to remove some voters (and try to absorb them into another district)
            [ undistrict ]
          set full? false
          ]
        if count turtles with [district = d-num] >= (1 - equal-population-error) * (count turtles) / num-districts [ ;;if turtle count close to quota, set as full
          set full? true
        ]
        if proportion-dem < packed-proportion-threshold and any? patches with [full? = true] [
          ask min-n-of ((count patches with [district = d-num]) / 2) patches with [district = d-num] [count democrats-here] ;;remove half of district randomly to remove some voters (and try to absorb them into another district)
                [ undistrict ]
          set full? false
    ]
      ]
      find-clusters
      release-noncontiguous-portions
      find-enclaves
      fill-in-enclaves
      ask patches with [district = d-num and packed? = true] [
        ifelse any? turtles with [district = d-num]
        [
            set proportion-dem (dem-votes d-num) / (count turtles with [district = d-num])
        ]
        [ set proportion-dem 0 ]
      ]
      tick
    ]
    check-trapped
    set d-num d-num + 1
  ]
  find-enclaves
  fill-in-enclaves
end

to salamander
  if all? democrats [packed? = true] [stop]
  let dem-to-grab nobody
  let slither-dist 0
  ifelse random 100 < 5
  [ set dem-to-grab one-of democrats with [packed? = false] ]
  [ set dem-to-grab min-one-of democrats with [packed? = false and not any? republicans-here] [distance myself] ]
  ifelse dem-to-grab = nobody
  [ set slither-dist 0 ]
  [ set slither-dist distance dem-to-grab + 1 ]
  let slither 1
  while [slither < slither-dist] [
    if (patch-at-heading-and-distance (towards dem-to-grab) (slither) != nobody)
    and ([packed?] of patch-at-heading-and-distance (towards dem-to-grab) (slither) = false)
    [
      if count republicans-on patch-at-heading-and-distance (towards dem-to-grab) (slither) <= count democrats-on patch-at-heading-and-distance (towards dem-to-grab) (slither)
      [
        ask patch-at-heading-and-distance (towards dem-to-grab) (slither) [
          set pcolor [pcolor] of myself
          set district [district] of myself
          set cluster nobody
          set full? false
          set border? false
          set packed? true
          if any? neighbors4 with [packed? = false] [
          ask neighbors4 with [packed? = false] [
              set pcolor [pcolor] of myself
              set district [district] of myself
              set cluster nobody
              set full? false
              set border? false
              set packed? true
            ]
          ]
        ]
      ]
   ]
    set slither slither + 1
  ]
end

to recheck-packed-district
  let d-num 1
  while [d-num <= num-districts] [
    if any? turtles with [district = d-num and packed? = true] [
      if count turtles with [district = d-num and packed? = true] >= (1 + equal-population-error) * (count turtles) / (num-districts) [
        ask patches with [district = d-num] [ set full? false ]
        create-packed-district
      ]
      if (count democrats with [district = d-num and packed? = true]) / (count turtles with [district = d-num and packed? = true]) < packed-proportion-threshold [
        create-packed-district
      ]
    ]
    set d-num d-num + 1
  ]
end

to check-trapped
  let d-num 1
  while [d-num <= num-districts] [
    if any? patches with [district = d-num] [
      if all? patches with [district = d-num] [all? neighbors4 [district = d-num or packed? = true]] [
        ask patches with [district = d-num] [
          undistrict
        ]
      ]
    ]
    set d-num d-num + 1
  ]
end

to fill-in-enclaves
  ;;find the size of each hole
    let enclave-num 1
    let max-enclave-size 0
    while [ enclave-num <= total-enclaves ] [ ;; cycle through black holes to find largest one (should be external blackness)
      if count patches with [enclave = enclave-num] >= max-enclave-size [ ;;checks number of patches in each black hole
        set max-enclave-size count patches with [enclave = enclave-num]
      ]
     set enclave-num enclave-num + 1
    ]
  set enclave-num 1
  while [enclave-num <= total-enclaves] [
    let absorbing-district nobody
    ask patches with [(enclave = enclave-num) and (count patches with [enclave = enclave-num] < max-enclave-size)] [ ;;fill all black holes with surronding packed district
      if any? neighbors4 with [packed? = true] [
        ask one-of neighbors4 with [packed? = true]
        [
          set absorbing-district self
        ]
      set pcolor [pcolor] of absorbing-district ;;and absorb the black patch
      set district [district] of absorbing-district
      set packed? [packed?] of absorbing-district
      set full? [full?] of absorbing-district
      set cracked? [cracked?] of absorbing-district
      ]
    ]
    set enclave-num enclave-num + 1
    ]
end

to find-enclaves
  ask patches [ set enclave nobody ] ;;reset enclave after new packed district made
  let enclave-num 1
  while [ any? patches with [(packed? = false) and (enclave = nobody)] ] [
    ;; pick a random not-packed patch that isn't in a enclave yet
    let seed one-of patches with [(packed? = false) and (enclave = nobody)]
    ;; otherwise, make the not-packed patch patch the "leader" of a new enclave
    ;; by assigning itself to its own enclave, then call
    ;; grow-enclave to find the rest of the hole
    ask seed
    [
      set enclave enclave-num
      grow-enclaves
    ]
    set enclave-num enclave-num + 1
  ]
  ifelse not any? patches with [packed? = false]
  [set total-enclaves 0]
  [set total-enclaves max [enclave] of patches]
end

to grow-enclaves  ;; patch procedure
  ask neighbors4 with [(enclave = nobody) and (packed? = false)]
  [
    set enclave [enclave] of myself
    grow-enclaves
  ]
end



to-report dem-votes [d-num]
  report count democrats with [district = d-num]
end

to-report gop-votes [d-num]
  report count republicans with [district = d-num]
end


to check-pack-and-crack
  let d-num 1
  while [ d-num <= num-districts ] [
    let dem-proportion 0
    ifelse not any? turtles with [district = d-num]
    [ ifelse ( dem-votes d-num ) = 0 [ set dem-proportion 0 ] [ set dem-proportion 1 ] ]
      [ set dem-proportion (dem-votes d-num) / ( count turtles with [district = d-num] ) ]
    ask patches with [full? = true and district = d-num] [
    ifelse dem-proportion > 0.75 [ set packed? true ] [ set packed? false ]
    ifelse ( dem-proportion < 0.5 and dem-proportion > 0.4 ) [ set cracked? true ] [ set cracked? false ]
    ]
    set d-num d-num + 1
  ]
end


to redistrict
  if reseed? [
    district-seed
    set reseed? false
  ]
  check-district-count ;; checks for capacity, if it's too big, and if a district has been completely swallowed up
  fill-holes
  make-districts ;;builds possible districts
  find-clusters
  release-noncontiguous-portions
  if all? turtles [district > 0 ] [ district-leftovers ] ;;fill in turtle-less black patches if that's all that's left
  if all? patches [full? = true] [ ;;finishing steps for stuff to look nice and make final calculations
    identify-dem-wins ;;counts d-reps and sets d-win? to true, also flips for wins if tied
    identify-gop-wins ;;counts r-reps and sets d-win? to false
    recolor-districts ;;recolor to indicate winner and create borders around districts
    label-districts
    display
    print timer
    if only-district-maps? = false [ wait 0.7 ]
    set dem-wins-list insert-item 0 dem-wins-list d-reps ;;list of districts won by dems for histogram
    update-plots
    set total-ties total-ties + ties
    set total-ties-to-wins total-ties-to-wins + ties-to-wins
    set reseed? true
    if only-district-maps? = false [ reset-ticks ]
    ifelse num-maps-made < num-maps
    [
      set num-maps-made num-maps-made + 1
      set reseed? true
    ]
    [
      set num-maps-made 1
      set reseed? true
      stop
    ]
  ]
  if only-district-maps? = false [ tick ]
end

to district-seed  ;;create num-districts districts with num-voters/num-districts people in each
  set color-list [8 9 12 13 17 18 19 22 23 24 25 26 27 28 29 32 33 34 35 36 37 38 39 42 43 44 45 46 47 48 49 52 53
          54 55 56 57 58 59 62 63 64 65 66 67 68 69 72 73 74 75 76 77 78 79 82 83 84 85 86 87 88 89 92 93 94 95 96 97 98 99 102 103 107 108 109
          112 113 114 115 116 117 118 119 122 123 124 125 126 127 128 129 132 133 134 135 136 137 138 139] ;; only use lighter colors
  set color-list shuffle color-list ;;put colors in random order
  ask patches [ undistrict ]
  if only-district-maps? = false [ reset-ticks ]
  while [ count patches with [seed? = true] != num-districts ] [
    ask one-of turtles [
      ask patch-here [
       set seed? true
       set pcolor first color-list ;;chose colors off the front of the list
       set color-list but-first color-list ;;remove color used to ensure distinct colors
      ]
    ]
  ]
  (foreach (sort patches with [seed? = true]) (n-values num-districts [i -> i + 1])
    [ [the-patch district-num] -> ask the-patch [ set district district-num ] ])  ;;gives each seed a consecutive number for its district to generate
end

to check-district-count
  let d-num 1
  while [d-num <= num-districts] [ ;;cycle through all the districts
    ifelse count turtles with [district = d-num] >= (1 - equal-population-error) * (count turtles) / num-districts [ ;;stop growing district if district is at 85% of even split of voters
      ask patches with [district = d-num] [
        set full? true
      ]
      if count turtles with [district = d-num] >= (1 + equal-population-error) * (count turtles) / num-districts [ ;;if 15% increase above even split of voters
        ask n-of (round ((count patches with [district = d-num]) / 2)) patches with [district = d-num] [ undistrict ]  ;;remove half of district randomly to remove some voters (and try to absorb them into another district)
        ]
    ]
    [
      ifelse not any? patches with [district = d-num] [ ;;if a district has been completely swallowed up by the districting process
        ask one-of turtles with [packed? = false] [
          ask patch-here [ ;;start another seed with random coords
            set seed? true
            if empty? color-list [
              set color-list shuffle remove [pcolor] of patches [8 9 12 13 17 18 19 22 23 24 25 26 27 28 29 32 33 34 35 36 37 38 39 42 43 44 45 46 47 48 49 52 53
          54 55 56 57 58 59 62 63 64 65 66 67 68 69 72 73 74 75 76 77 78 79 82 83 84 85 86 87 88 89 92 93 94 95 96 97 98 99 102 103 107 108 109
          112 113 114 115 116 117 118 119 122 123 124 125 126 127 128 129 132 133 134 135 136 137 138 139]
            ]
            set pcolor first color-list ;;chose colors off the front of the list
            set color-list but-first color-list ;;remove color used to ensure distinct colors
            set district d-num
            set full? false
            set cluster nobody
            set border? false
            ask neighbors4 with [packed? = false] [ ;;automatically give the district the seed's neighbors
              set pcolor [pcolor] of myself
              set district [district] of myself
              set cluster nobody
              set full? false
              set border? false
              set packed? false
            ]
          ]
        ]
      ]
      [
      ask patches with [district = d-num] [
        set full? false  ;;if the total in the district has been reduced due to stolen voters allow more people to be added
      ]
    ]
    ]
    set d-num d-num + 1
  ]
end

to make-districts ;;make districts by asking colored patches to absorb neighbors if it has fewer turtles than all of it's neighbors or if all neighbors are black
  ask patches with [ (district > 0) and (full? = false) and (packed? = false) ] [
    let voters count turtles with [ district = [district] of myself ]
    ;;else absorb only if current patch has smallest number of turtles of all neighbors
    if all? neighbors4 with [district > 0 and packed? = false] [ count turtles with [ district = [district] of self ] >= voters ] [
      ask neighbors4 with [packed? = false] [
          set pcolor [pcolor] of myself
          set district [district] of myself
        ]
    ]
     if all? neighbors4 with [district > 0] [full? = true] [ ;;if all of their districted neighbors are at at capacity
      if any? neighbors4 with [district > 0 and packed? = false] [ ;;and if they aren't surrounded by black patches
        ask one-of neighbors4 with [full? = true and packed? = false] [  ;;then ask one of the neighbors at capacity
          ask neighbors4 with [district = 0] [  ;;to absorb the black neighbors
            set pcolor [pcolor] of myself  ;;change the color of the patch to indicate the district
            set district [district] of myself
          ]
        ]
       ]
    ]
  ]
end

to make-cracked-districts
  set dems-packed count democrats with [packed? = true]
  set dem-split (count democrats - dems-packed) / (num-districts - total-packed)
  let voters 0
  ;;if not cracked yet, absorb neighbors indiscriminately
  ask patches with [ (district > 0) and (full? = false) and (packed? = false) ] [
    set voters count turtles with [ district = [district] of myself ] ;;count num voters on each district
    ifelse cracked? = false
    [
    ;;absorb only if current district has fewer turtles than all neighbors (that aren't packed already, but could be full)
    if all? neighbors4 with [district > 0 and packed? = false] [ count turtles with [ district = [district] of self ] >= voters ] [
      if any? neighbors4 with [cracked? = false] [
        ask neighbors4 with [packed? = false and cracked? = false] [ ;;take anything from non-cracked districts
        set pcolor [pcolor] of myself
        set district [district] of myself
        set packed? [packed?] of myself
        ]
      ]
      if any? neighbors4 with [cracked? = true and not any? democrats-here] [
        ask neighbors4 with [packed? = false and cracked? = true and not any? democrats-here] [ ;;only take gop from cracked districts
        set pcolor [pcolor] of myself
        set district [district] of myself
        set packed? [packed?] of myself
        ]
      ]
    ]
  ]
  [
    ;;absorb empty or gop only if current district has fewer turtles than all neighbors (that aren't packed already)
    if all? neighbors4 with [district > 0 and packed? = false] [ count turtles with [ district = [district] of self ] >= voters ] [
        if any? neighbors4 with [not any? democrats-here] [
          ask neighbors4 with [packed? = false and not any? democrats-here] [
            set pcolor [pcolor] of myself
            set district [district] of myself
            set packed? [packed?] of myself
        ]
    ]
      ]
    ]
  ]
  let d-num 1
  while [d-num <= num-districts] [
    if all? patches with [district = d-num] [packed? = false] [
      ;;check if dem count is within acceptable range
      ifelse count democrats with [district = d-num] > 0.75 * dem-split and count democrats with [district = d-num] < 1.25 * dem-split
      [
        ask patches with [district = d-num] [set cracked? true] ;;can be designated as cracked, but not full yet
      ]
      [
        ifelse count democrats with [district = d-num] >= 1.25 * dem-split
        ;;if too high, get rid of all? dems
        [
          ask max-n-of (count patches with [district = d-num] / 2) patches with [district = d-num] [count democrats-here]
          [ undistrict ] ;;cut patches with dems
        ]
        ;;if too low, get rid of empty or gops if district is full, otherwise just set it to false
        [
          if all? patches with [district = d-num ] [full? = true] [
            ask min-n-of (count patches with [district = d-num] / 2) patches with [district = d-num] [count democrats-here]
            [ undistrict ] ;;cut patches, but try to keep dems
          ]
        ]
        ask patches with [district = d-num] [set cracked? false]
      ]
    ]
    set d-num d-num + 1
  ]
end

to fill-holes
  let absorbing-district nobody
  ask patches with [(district = 0) and (all? neighbors4 with [district > 0] [full? = true])] [ ;;if black patch has only full districts surrounding it
      ifelse any? neighbors4 with [packed? = false] [
        set absorbing-district one-of neighbors4 with [packed? = false] ;;force non-packed neighbor if possible
        set pcolor [pcolor] of absorbing-district ;;and absorb the black patch
        set district [district] of absorbing-district
        set packed? [packed?] of absorbing-district
        set full? [full?] of absorbing-district
      ]
      [
        set absorbing-district one-of neighbors4 ;;otherwise, choose a random full packed district
        set pcolor [pcolor] of absorbing-district ;;and absorb the black patch
        set district [district] of absorbing-district
        set packed? [packed?] of absorbing-district
        set full? [full?] of absorbing-district
      ]
    ]
end


to release-noncontiguous-portions
  ;;for each district, find size of each cluster
  let d-num 1
  while [ d-num <= num-districts ] [ ;;cycle through each district
    let cluster-num 1
    let max-cluster 0
    let max-cluster-size 0
    while [ cluster-num <= total-clusters ] [ ;;for each district, cycle through clusters
      if count patches with [(cluster = cluster-num) and (district = d-num)] >= max-cluster-size [ ;;checks number of turtles in each cluster
        set max-cluster-size count patches with [(cluster = cluster-num) and (district = d-num)]
        set max-cluster cluster-num
      ]
     set cluster-num cluster-num + 1
    ]
    ask patches with [(district = d-num) and (cluster != max-cluster)] [ ;;reset all portions small clusters of districts back to un-districted
      undistrict
    ]
    set d-num d-num + 1
  ]
end

to find-clusters
  ask patches [ set cluster nobody ] ;;reset clusters after new districts made
  let cluster-num 1
  while [ any? patches with [(district > 0) and (cluster = nobody)] ] [
    ;; pick a random patch that isn't in a cluster yet
    let seed one-of patches with [(district > 0) and (cluster = nobody)]
    ;; otherwise, make the patch the "leader" of a new cluster
    ;; by assigning itself to its own cluster, then call
    ;; grow-cluster to find the rest of the cluster
    ask seed
    [ set cluster cluster-num
      grow-cluster ]
    set cluster-num cluster-num + 1
  ]
  set total-clusters max [cluster] of patches
end

to grow-cluster  ;; patch procedure
  ask neighbors4 with [(cluster = nobody) and
    (district = [district] of myself)]
  [ set cluster [cluster] of myself
    grow-cluster ]
end

to recolor-districts
   find-borders
  ask patches [
    ifelse d-win?
    [ ifelse packed? = true
      [ set pcolor blue + 1 ]
      [ set pcolor blue + 3 ]
    ]
    [ set pcolor red + 3 ]
  ]
  ask patches [
    if border? [
        set pcolor scale-color pcolor 20 0 50
    ]
  ]
end

to find-borders
  ask patches [
    if not all? neighbors4 [pcolor = [pcolor] of myself] [set border? true]
  ]
end

to district-leftovers
  let absorbing-district nobody
  ask patches with [district = 0 and not any? turtles-here] [ ;;if there aren't any voters that aren't already in districts, just fill in the rest of the black, regardless of how full they are (since it won't matter)
    if any? neighbors4 with [district > 0] [
      ifelse any? neighbors4 with [district > 0 and packed? = false]
      [
        set absorbing-district one-of neighbors4 with [district > 0 and packed? = false]
      ]
      [
        set absorbing-district one-of neighbors4 with [district > 0]
      ]
      set pcolor [pcolor] of absorbing-district
      set district [district] of absorbing-district
      set packed? [packed?] of absorbing-district
      set full? [full?] of absorbing-district
      set cracked? [cracked?] of absorbing-district
    ]
  ]
  if all? patches with [district > 0] [packed? = true or cracked? = true] [
    ask patches with [district = 0 and any? turtles-here] [
      if any? neighbors4 with [district > 0] [
        if any? democrats-here [
          ifelse any? neighbors4 with [cracked? = true]
          [
            set absorbing-district min-one-of neighbors4 with [cracked? = true] [count democrats with [district = [district] of self]]
          ]
          [
            set absorbing-district min-one-of neighbors4 [count democrats with [district = [district] of self]]
          ]
        ]
        if any? republicans-here [
          ifelse any? neighbors4 with [cracked? = true]
          [
            set absorbing-district min-one-of neighbors4 with [cracked? = true] [count turtles with [district = [district] of self]]
          ]
          [
            set absorbing-district max-one-of neighbors4 [count democrats with [district = [district] of self]]
          ]
        ]
        set pcolor [pcolor] of absorbing-district
        set district [district] of absorbing-district
        set packed? [packed?] of absorbing-district
        set full? [full?] of absorbing-district
        set cracked? [cracked?] of absorbing-district
      ]
    ]
  ]
end

to identify-dem-wins ;;counts number of districts where dems won
  settle-ties
  set d-reps ties-to-wins ;;automatically adds the wins from the coin flips in settle-ties
  let d-num 1
  while [d-num <= num-districts] [
      if count democrats with [district = d-num] > count republicans with [district = d-num] [
        set d-reps d-reps + 1
      ask patches with [district = d-num] [
        set d-win? true
       set tie? false
      ]
    ]
    set d-num d-num + 1
  ]
end

to identify-gop-wins ;;counts number of districts where gop won
  set r-reps ties - ties-to-wins
  let d-num 1
  while [d-num <= num-districts] [
      if count democrats with [district = d-num] < count republicans with [district = d-num] [
        set r-reps r-reps + 1
      ask patches with [district = d-num] [
        set d-win? false
       set tie? false
      ]
    ]
    set d-num d-num + 1
  ]
end

to identify-num-ties ;;counts the number of districts that have equal d/r votes
  set ties 0
  let d-num 1
  while [d-num <= num-districts] [
      if count democrats with [district = d-num] = count republicans with [district = d-num] [
        set ties ties + 1
      ask patches with [district = d-num] [ set tie? true ]
    ]
    set d-num d-num + 1
  ]
end

to settle-ties ;;flips a coin to determine outcome of tied districts
  identify-num-ties
  set ties-to-wins 0
  let tie-counter 0
  while [ tie-counter < ties ] [
    if random 100 < 50 [ set ties-to-wins ties-to-wins + 1 ] ;;50% chance for tied district to get the win
    set tie-counter tie-counter + 1
  ]
  let d-num 1
  let num-win-flip 1
  while [(num-win-flip <= ties-to-wins) and (d-num <= num-districts)] [
    ask patches with [district = d-num] [
      if tie? = true
      [
        set d-win? true
      ]
    ]
      ask one-of patches with [district = d-num] [
        if tie? = true [
          set num-win-flip num-win-flip + 1
        ]
      ]
      set d-num d-num + 1
    ]
end

to label-districts
  let d-num 1
  let xmean-cor 0
  let ymean-cor 0
  while [ d-num <= num-districts ] [
    set xmean-cor mean [pxcor] of patches with [district = d-num]
    set ymean-cor mean [pycor] of patches with [district = d-num]
    ifelse any? patches with [district = d-num and border? = false]
    [
      ask min-one-of patches with [district = d-num and border? = false] [distance patch xmean-cor ymean-cor] [
      set plabel d-num
      set plabel-color white
    ]
    ]
    [
      ask min-one-of patches with [district = d-num] [distance patch xmean-cor ymean-cor] [
      set plabel d-num
      set plabel-color white
    ]
    ]
    set d-num d-num + 1
  ]
end

to undistrict
  set pcolor black
  set seed? false
  set district 0
  set cluster nobody
  set full? false
  set plabel ""
  set border? false
  set d-win? false
  set tie? false
  set packed? false
  set cracked? false
end

to-report prob-tie-to-dems
  ifelse total-ties = 0
  [ report "N/A" ]
  [ report total-ties-to-wins / total-ties ]
end

to-report proportion-of-occurence [wins]
  ifelse length dem-wins-list = 0
  [ report 0 ]
  [ report frequency-of-occurence wins / length dem-wins-list ]
end


to-report frequency-of-occurence [wins]
  report length filter [i -> i = wins] dem-wins-list
end

to check-specific-proportion
  set user-specified-dem-districts-won runresult
                              user-one-of "Choose the number of districts won by Democrats."
                              map [i -> (word i) ] n-values (num-districts + 1) [ i -> i ]
  ifelse length dem-wins-list = 0
  [ set user-specified-proportion 0 ]
  [ set user-specified-proportion (user-specified-dem-districts-won / length dem-wins-list) ]
end
@#$#@#$#@
GRAPHICS-WINDOW
680
10
1117
448
-1
-1
13.0
1
20
1
1
1
0
0
0
1
-16
16
-16
16
1
1
1
ticks
150.0

BUTTON
30
30
222
63
Set Population Distribution
setup
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL
1

BUTTON
235
30
395
63
Create District Maps
redistrict
T
1
T
OBSERVER
NIL
NIL
NIL
NIL
1

SLIDER
30
75
220
108
num-voters
num-voters
50
150
100.0
10
1
NIL
HORIZONTAL

SLIDER
30
120
220
153
num-districts
num-districts
1
10
7.0
1
1
NIL
HORIZONTAL

SLIDER
30
165
220
198
dem-percentage
dem-percentage
0
100
55.0
1
1
NIL
HORIZONTAL

PLOT
235
75
655
290
Total Districts Received
number of Democratic districts won
frequency
0.0
10.0
0.0
10.0
true
false
"set-plot-x-range 0 num-districts + 1\n;set-plot-y-range 0 (length dem-wins-list) + 1\nset-histogram-num-bars num-districts " ""
PENS
"No Gerrymander" 1.0 1 -13345367 true "" "histogram dem-wins-list"
"Gerrymander" 1.0 1 -8990512 true "" "histogram gerrymander-results"

MONITOR
450
300
655
345
Number of Random District Maps
length dem-wins-list
17
1
11

BUTTON
255
385
470
435
NIL
check-specific-proportion
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL
1

MONITOR
25
455
915
500
How many district maps that you generated had this election outcome?
(word \"Out of \" \nlength dem-wins-list\n\" \\nrandomly generated district maps, Democrats have won exactly \" \nuser-specified-dem-districts-won\n\" district(s) \"\nfrequency-of-occurence user-specified-dem-districts-won\n\" time(s). In other words, \"\nprecision (100 * (proportion-of-occurence user-specified-dem-districts-won)) 2\n\"% of district maps have this election result.\"\n)
17
1
11

TEXTBOX
35
390
240
435
Click this button to find the percent of district maps that have had a specific number of Democratic districts.
11
0.0
1

SLIDER
30
255
220
288
num-maps
num-maps
1
100
1.0
1
1
NIL
HORIZONTAL

SLIDER
30
210
220
243
num-cities
num-cities
0
3
1.0
1
1
NIL
HORIZONTAL

SWITCH
30
305
220
338
only-district-maps?
only-district-maps?
1
1
-1000

BUTTON
405
10
657
43
Create Republican Gerrymander
gerrymander
T
1
T
OBSERVER
NIL
NIL
NIL
NIL
1

MONITOR
235
300
440
345
Number of Gerrymandered Maps
length gerrymander-results
17
1
11

BUTTON
405
45
612
78
Create Democractic Gerrmander
NIL
T
1
T
OBSERVER
NIL
NIL
NIL
NIL
1

@#$#@#$#@
## WHAT IS IT?

This model randomly generates district maps for a square state using standard districting rules -- equal populations and contiguous districts. A two-party system is assumed, with blue representing an individual who will vote for the democratic candidate and red representing an individual who will vote for the republican candidate. Election outcomes of each district are calculated using a first-past-the-post voting method and are shown on the square map in the party color. The outcomes are aggregated to display a histogram of the total districts won over many random maps.

## HOW IT WORKS

The population is randomly distributed based on the number of city-centers. A proportion of the total number of voters is distributed using an exponential distribution. Democrats are clustered more closely around cities, where a larger proportion of republicans are distributed uniformly throughout the square state. This follows from demographic studies that show democrats have a tendency to pack naturally into districts. Cities follow an approximate Zipf’s law, where the population and density of cities diminishes with each city created.

Random individuals in the population are chosen to initialize districts. Districts expand by absorbing neutral neighboring patches and checking for population sizes given an internal threshold of “equal” populations. If districts become noncontiguous through this process, the smaller portion of the district becomes neutral once again and able to be absorbed by another district. If districts become too populous, half of its patches are reset as neutral. This process continues until all districts are within the threshold of equalness. 

Then election outcomes are calculated by finding the majority party within each district. If there is a tie, a coin flip is used to decide the outcome (not unlike how actual US election ties have been decided in the past -- Grabar 2012).

## HOW TO USE IT

Click the Set Population button, then the Create Districts button to generate a random district map and election outcome with the default settings. Continue to click the Create Districts button to add election results to the histogram. When changes are made to the population distribution, the histogram will reset.

The population distribution is determined by the sliders on the left labeled num-voters, num-districts, dem-percentage, and num-cities. The num-voters slider sets the total number of individuals in the population; the num-districts slider sets the number of districts created. Note, together these determine the number of constituents that each elected representative represents. The dem-percentage slider sets the proportion of the population that votes for the democratic candidate, rounded to the nearest whole person. The simulation assumes that the rest of the population votes for the republican candidate. The num-cities slider sets the number of city-centers in the square. This causes proportions of the population to cluster around the city-centers using an exponential probability distribution with a larger effect on democrats than republicans.

The Set Population button creates a random population based on the parameters set above.

The num-maps slider determines the number of maps and election outcomes that the simulation will randomly generate and include on the histogram.

The Create Districts button generates the user-defined number of random district maps, displaying the election outcome of every map created.

The Create Gerrymandered District Maps generates the user-defined number of gerrymandered random district maps by packing and cracking. The number of packed districts is set within the code to be the average of the minimum number needed to win all the districts (theoretically) and the maximum number that could be packed. The rest of the districts are cracked.

The check-specific-proportion button will calculate the percentage of maps created so far with a fixed population that resulted in the number of democratic districts requested.

## THINGS TO NOTICE

Notice the number of districts that tend to elect democratic representatives in comparison to the proportion of democrats in the population. Is the proportion of districts won similar to the proportion of democrats in the square state? When is it similar? When is it not?

Notice the geographic sizes of the districts. Are they all roughly the same size? Why or why not?

Generally, compactness is required for districts, but it is not hard-coded into this model. Generate many maps. Do you notice compactness in the districts?

How do the random election outcomes compare to the gerrymandered result? Was the election outcome likely for the randomly generated non-gerrymandered maps? 

## THINGS TO TRY

Try setting the num-cities to zero. This uniformly distributes the population. What happens to the typical election outcome as dem-percentage changes. Is this what you expected?

Generate lots of random district maps with the ‘Create District Maps’ button (like, hundreds). Then, create a gerrymandered district map for the same population distribution. Note the number of Democrat district wins. Click the button ‘check-specific-proportion’ and choose the number of Democratic district wins from the drop-down menu. What does the output in the text box below tell you?

Generate a bunch of gerrymandered maps and non-gerrymandered maps for the same population distribution. How do the two distributions compare? (Be careful to note the bar endpoints -- the bars may be slightly offset.)

## EXTENDING THE MODEL

Make a gerrymander button to create biased maps that favor Democrats.

Use a snake-type method to wind around the world to collect only Democrats for the packed districts. This will create some interesting noncompact shapes, but what else happens?

Add a compactness measure and report it. Or, make compactness another condition on the districts.

Add in local lines for counties or school districts that must be maintained (or rivers or lakes).

Try to reproduce the results Chen and Rodden saw where Democrats unintentionally packing themselves into districts. Possibly start with parameter tweaks to change the relative densities of the cities to the rural areas.


In general, the code needs to be cleaned up. I’m sure there are lots of redundant and extraneous portions. 

## RELATED MODELS

I used the Patch Clusters Example with slight modifications in the Netlogo Library to maintain the contiguity requirement.

I also found two related models: 
 
Congressional Redistricting by Luke Elissiry on the NetLogo Modeling Commons (http://modelingcommons.org/browse/one_model/5063#model_tabs_browse_info)

NetDistrict by Collin Lysford on the Metric Geometry and Gerrymandering Group’s GitHub site (https://github.com/gerrymandr/NetDistrict)


## CREDITS AND REFERENCES

Thanks to the Metric Geometry and Gerrymandering Group at Tufts University for the wonderful workshop I attended in Madison, WI. The expert witness workshop and sponsored hackathon inspired me to create an agent-based model to explore some of the ideas we discussed.

Bangia, Sachet, Christy Vaughn Graves, Gregory Herschlag, Han Sung Kang, Justin Luo, Jonathan C. Mattingly, and Robert Ravier. 2017. "Redistricting: Drawing the Line." (Apr): 1-44. http://arxiv.org/abs/1704.03360.

Chen, Jowei and Jonathan Rodden. 2013. "Unintentional Gerrymandering: Political Geography and Electoral Bias in Legislatures." Quarterly Journal of Political Science 8 (3) (Jan): 239-269.

Chikina, Maria, Alan Frieze, and Wesley Pegden. 2016. "Assessing Significance in a Markov Chain without Mixing." (Aug). http://arxiv.org/abs/1608.02014.

Grabar, Henry. 2012. "When a State Election can be Literally Determined by a Coin Toss." The Atlantic, Nov.

Liu, Yan Y., Wendy K. Tam Cho, and Shaowen Wang. 2016. "PEAR: A Massively Parallel Evolutionary Computation Approach for Political Redistricting Optimization and Analysis." Swarm and Evolutionary Computation 30 (May): 78-92. doi:10.1016/j.swevo.2016.04.004. https://www.sciencedirect.com/science/article/pii/S2210650216300220.
@#$#@#$#@
default
true
0
Polygon -7500403 true true 150 5 40 250 150 205 260 250

airplane
true
0
Polygon -7500403 true true 150 0 135 15 120 60 120 105 15 165 15 195 120 180 135 240 105 270 120 285 150 270 180 285 210 270 165 240 180 180 285 195 285 165 180 105 180 60 165 15

arrow
true
0
Polygon -7500403 true true 150 0 0 150 105 150 105 293 195 293 195 150 300 150

box
false
0
Polygon -7500403 true true 150 285 285 225 285 75 150 135
Polygon -7500403 true true 150 135 15 75 150 15 285 75
Polygon -7500403 true true 15 75 15 225 150 285 150 135
Line -16777216 false 150 285 150 135
Line -16777216 false 150 135 15 75
Line -16777216 false 150 135 285 75

bug
true
0
Circle -7500403 true true 96 182 108
Circle -7500403 true true 110 127 80
Circle -7500403 true true 110 75 80
Line -7500403 true 150 100 80 30
Line -7500403 true 150 100 220 30

butterfly
true
0
Polygon -7500403 true true 150 165 209 199 225 225 225 255 195 270 165 255 150 240
Polygon -7500403 true true 150 165 89 198 75 225 75 255 105 270 135 255 150 240
Polygon -7500403 true true 139 148 100 105 55 90 25 90 10 105 10 135 25 180 40 195 85 194 139 163
Polygon -7500403 true true 162 150 200 105 245 90 275 90 290 105 290 135 275 180 260 195 215 195 162 165
Polygon -16777216 true false 150 255 135 225 120 150 135 120 150 105 165 120 180 150 165 225
Circle -16777216 true false 135 90 30
Line -16777216 false 150 105 195 60
Line -16777216 false 150 105 105 60

car
false
0
Polygon -7500403 true true 300 180 279 164 261 144 240 135 226 132 213 106 203 84 185 63 159 50 135 50 75 60 0 150 0 165 0 225 300 225 300 180
Circle -16777216 true false 180 180 90
Circle -16777216 true false 30 180 90
Polygon -16777216 true false 162 80 132 78 134 135 209 135 194 105 189 96 180 89
Circle -7500403 true true 47 195 58
Circle -7500403 true true 195 195 58

circle
false
0
Circle -7500403 true true 0 0 300

circle 2
false
0
Circle -7500403 true true 0 0 300
Circle -16777216 true false 30 30 240

cow
false
0
Polygon -7500403 true true 200 193 197 249 179 249 177 196 166 187 140 189 93 191 78 179 72 211 49 209 48 181 37 149 25 120 25 89 45 72 103 84 179 75 198 76 252 64 272 81 293 103 285 121 255 121 242 118 224 167
Polygon -7500403 true true 73 210 86 251 62 249 48 208
Polygon -7500403 true true 25 114 16 195 9 204 23 213 25 200 39 123

cylinder
false
0
Circle -7500403 true true 0 0 300

dot
false
0
Circle -7500403 true true 90 90 120

face happy
false
0
Circle -7500403 true true 8 8 285
Circle -16777216 true false 60 75 60
Circle -16777216 true false 180 75 60
Polygon -16777216 true false 150 255 90 239 62 213 47 191 67 179 90 203 109 218 150 225 192 218 210 203 227 181 251 194 236 217 212 240

face neutral
false
0
Circle -7500403 true true 8 7 285
Circle -16777216 true false 60 75 60
Circle -16777216 true false 180 75 60
Rectangle -16777216 true false 60 195 240 225

face sad
false
0
Circle -7500403 true true 8 8 285
Circle -16777216 true false 60 75 60
Circle -16777216 true false 180 75 60
Polygon -16777216 true false 150 168 90 184 62 210 47 232 67 244 90 220 109 205 150 198 192 205 210 220 227 242 251 229 236 206 212 183

fish
false
0
Polygon -1 true false 44 131 21 87 15 86 0 120 15 150 0 180 13 214 20 212 45 166
Polygon -1 true false 135 195 119 235 95 218 76 210 46 204 60 165
Polygon -1 true false 75 45 83 77 71 103 86 114 166 78 135 60
Polygon -7500403 true true 30 136 151 77 226 81 280 119 292 146 292 160 287 170 270 195 195 210 151 212 30 166
Circle -16777216 true false 215 106 30

flag
false
0
Rectangle -7500403 true true 60 15 75 300
Polygon -7500403 true true 90 150 270 90 90 30
Line -7500403 true 75 135 90 135
Line -7500403 true 75 45 90 45

flower
false
0
Polygon -10899396 true false 135 120 165 165 180 210 180 240 150 300 165 300 195 240 195 195 165 135
Circle -7500403 true true 85 132 38
Circle -7500403 true true 130 147 38
Circle -7500403 true true 192 85 38
Circle -7500403 true true 85 40 38
Circle -7500403 true true 177 40 38
Circle -7500403 true true 177 132 38
Circle -7500403 true true 70 85 38
Circle -7500403 true true 130 25 38
Circle -7500403 true true 96 51 108
Circle -16777216 true false 113 68 74
Polygon -10899396 true false 189 233 219 188 249 173 279 188 234 218
Polygon -10899396 true false 180 255 150 210 105 210 75 240 135 240

house
false
0
Rectangle -7500403 true true 45 120 255 285
Rectangle -16777216 true false 120 210 180 285
Polygon -7500403 true true 15 120 150 15 285 120
Line -16777216 false 30 120 270 120

leaf
false
0
Polygon -7500403 true true 150 210 135 195 120 210 60 210 30 195 60 180 60 165 15 135 30 120 15 105 40 104 45 90 60 90 90 105 105 120 120 120 105 60 120 60 135 30 150 15 165 30 180 60 195 60 180 120 195 120 210 105 240 90 255 90 263 104 285 105 270 120 285 135 240 165 240 180 270 195 240 210 180 210 165 195
Polygon -7500403 true true 135 195 135 240 120 255 105 255 105 285 135 285 165 240 165 195

line
true
0
Line -7500403 true 150 0 150 300

line half
true
0
Line -7500403 true 150 0 150 150

pentagon
false
0
Polygon -7500403 true true 150 15 15 120 60 285 240 285 285 120

person
false
0
Circle -7500403 true true 110 5 80
Polygon -7500403 true true 105 90 120 195 90 285 105 300 135 300 150 225 165 300 195 300 210 285 180 195 195 90
Rectangle -7500403 true true 127 79 172 94
Polygon -7500403 true true 195 90 240 150 225 180 165 105
Polygon -7500403 true true 105 90 60 150 75 180 135 105

plant
false
0
Rectangle -7500403 true true 135 90 165 300
Polygon -7500403 true true 135 255 90 210 45 195 75 255 135 285
Polygon -7500403 true true 165 255 210 210 255 195 225 255 165 285
Polygon -7500403 true true 135 180 90 135 45 120 75 180 135 210
Polygon -7500403 true true 165 180 165 210 225 180 255 120 210 135
Polygon -7500403 true true 135 105 90 60 45 45 75 105 135 135
Polygon -7500403 true true 165 105 165 135 225 105 255 45 210 60
Polygon -7500403 true true 135 90 120 45 150 15 180 45 165 90

sheep
false
15
Circle -1 true true 203 65 88
Circle -1 true true 70 65 162
Circle -1 true true 150 105 120
Polygon -7500403 true false 218 120 240 165 255 165 278 120
Circle -7500403 true false 214 72 67
Rectangle -1 true true 164 223 179 298
Polygon -1 true true 45 285 30 285 30 240 15 195 45 210
Circle -1 true true 3 83 150
Rectangle -1 true true 65 221 80 296
Polygon -1 true true 195 285 210 285 210 240 240 210 195 210
Polygon -7500403 true false 276 85 285 105 302 99 294 83
Polygon -7500403 true false 219 85 210 105 193 99 201 83

square
false
0
Rectangle -7500403 true true 30 30 270 270

square 2
false
0
Rectangle -7500403 true true 30 30 270 270
Rectangle -16777216 true false 60 60 240 240

star
false
0
Polygon -7500403 true true 151 1 185 108 298 108 207 175 242 282 151 216 59 282 94 175 3 108 116 108

target
false
0
Circle -7500403 true true 0 0 300
Circle -16777216 true false 30 30 240
Circle -7500403 true true 60 60 180
Circle -16777216 true false 90 90 120
Circle -7500403 true true 120 120 60

tree
false
0
Circle -7500403 true true 118 3 94
Rectangle -6459832 true false 120 195 180 300
Circle -7500403 true true 65 21 108
Circle -7500403 true true 116 41 127
Circle -7500403 true true 45 90 120
Circle -7500403 true true 104 74 152

triangle
false
0
Polygon -7500403 true true 150 30 15 255 285 255

triangle 2
false
0
Polygon -7500403 true true 150 30 15 255 285 255
Polygon -16777216 true false 151 99 225 223 75 224

truck
false
0
Rectangle -7500403 true true 4 45 195 187
Polygon -7500403 true true 296 193 296 150 259 134 244 104 208 104 207 194
Rectangle -1 true false 195 60 195 105
Polygon -16777216 true false 238 112 252 141 219 141 218 112
Circle -16777216 true false 234 174 42
Rectangle -7500403 true true 181 185 214 194
Circle -16777216 true false 144 174 42
Circle -16777216 true false 24 174 42
Circle -7500403 false true 24 174 42
Circle -7500403 false true 144 174 42
Circle -7500403 false true 234 174 42

turtle
true
0
Polygon -10899396 true false 215 204 240 233 246 254 228 266 215 252 193 210
Polygon -10899396 true false 195 90 225 75 245 75 260 89 269 108 261 124 240 105 225 105 210 105
Polygon -10899396 true false 105 90 75 75 55 75 40 89 31 108 39 124 60 105 75 105 90 105
Polygon -10899396 true false 132 85 134 64 107 51 108 17 150 2 192 18 192 52 169 65 172 87
Polygon -10899396 true false 85 204 60 233 54 254 72 266 85 252 107 210
Polygon -7500403 true true 119 75 179 75 209 101 224 135 220 225 175 261 128 261 81 224 74 135 88 99

wheel
false
0
Circle -7500403 true true 3 3 294
Circle -16777216 true false 30 30 240
Line -7500403 true 150 285 150 15
Line -7500403 true 15 150 285 150
Circle -7500403 true true 120 120 60
Line -7500403 true 216 40 79 269
Line -7500403 true 40 84 269 221
Line -7500403 true 40 216 269 79
Line -7500403 true 84 40 221 269

wolf
false
0
Polygon -16777216 true false 253 133 245 131 245 133
Polygon -7500403 true true 2 194 13 197 30 191 38 193 38 205 20 226 20 257 27 265 38 266 40 260 31 253 31 230 60 206 68 198 75 209 66 228 65 243 82 261 84 268 100 267 103 261 77 239 79 231 100 207 98 196 119 201 143 202 160 195 166 210 172 213 173 238 167 251 160 248 154 265 169 264 178 247 186 240 198 260 200 271 217 271 219 262 207 258 195 230 192 198 210 184 227 164 242 144 259 145 284 151 277 141 293 140 299 134 297 127 273 119 270 105
Polygon -7500403 true true -1 195 14 180 36 166 40 153 53 140 82 131 134 133 159 126 188 115 227 108 236 102 238 98 268 86 269 92 281 87 269 103 269 113

x
false
0
Polygon -7500403 true true 270 75 225 30 30 225 75 270
Polygon -7500403 true true 30 75 75 30 270 225 225 270
@#$#@#$#@
NetLogo 6.0.4
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
default
0.0
-0.2 0 0.0 1.0
0.0 1 1.0 0.0
0.2 0 0.0 1.0
link direction
true
0
Line -7500403 true 150 150 90 180
Line -7500403 true 150 150 210 180
@#$#@#$#@
1
@#$#@#$#@
