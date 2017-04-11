igv
===

.. toctree::
   :maxdepth: 1

   general

   genome

   feature

   tracks

   readers

   parsers

   bam

   bigwig

   misc

   ui

   color


.. function:: loadBamIndex(indexURL, config, tabix)

   bam/bamIndex.js

.. function:: unbgzf(data, lim)

   bam/bgzf.js

.. function:: gotoLocusFeature(locusFeature, genome, browser)

   browser.js

.. function:: encodeSearch(continuation)

   encode/encodeSearch.js

.. function:: decodeGa4ghReadset(json)

   ga4gh/ga4ghAlignmentReader.js

.. function:: ga4ghGet(options)

   ga4gh/ga4ghHelper.js

.. function:: ga4ghSearch(options)

   ga4gh/ga4ghHelper.js

.. function:: ga4ghSearchReadGroupSets(options)

   ga4gh/ga4ghHelper.js

.. function:: ga4ghSearchVariantSets(options)

   ga4gh/ga4ghHelper.js

.. function:: ga4ghSearchCallSets(options)

   ga4gh/ga4ghHelper.js

.. function:: ga4ghSearchReadAndCallSets(options)

   ga4gh/ga4ghHelper.js

.. function:: createVCFVariant(tokens)

   variant/variant.js

.. function:: createGAVariant(json)

   variant/variant.js

.. function:: loadGenome(reference)

   genome.js

.. function:: hex2Color(hex)

   igv-color.js

.. function:: rgbaColor(r, g, b, a)

   igv-color.js

.. function:: rgbColor(r, g, b)

   igv-color.js

.. function:: addAlphaToRGB(rgbString, alpha)

   igv-color.js

.. function:: greyScale(value)

   igv-color.js

.. function:: randomGrey(min, max)

   igv-color.js

.. function:: randomRGB(min, max)

   igv-color.js

.. function:: randomRGBConstantAlpha(min, max, alpha)

   igv-color.js

.. function:: getCompositeColor(dest, src, alpha)

   igv-color.js

.. function:: createColorString(token)

   igv-color.js

.. function:: createBrowser(parentDiv, config)

   igv-create.js

.. function:: removeBrowser()

   igv-create.js

.. function:: makeToggleButton(buttonOnLabel, buttonOffLabel, configurationKey, get$Target, continuation)

   igv-utils.js

.. function:: presentAlert(string)

   igv-utils.js

.. function:: attachDialogCloseHandlerWithParent($parent, closeHandler)

   igv-utils.js

.. function:: spinner(size)

   igv-utils.js

.. function:: getSpinnerObjectWithParentElement(parentElement)

   igv-utils.js

.. function:: startSpinnerAtParentElement(parentElement)

   igv-utils.js

.. function:: stopSpinnerAtParentElement(parentElement)

   igv-utils.js

.. function:: parseUri(str)

   igv-utils.js

.. function:: domElementRectAsString(element)

   igv-utils.js

.. function:: isNumber(n)

   igv-utils.js

.. function:: guid()

   igv-utils.js

.. function:: random(min, max)

   igv-utils.js

.. function:: prettyBasePairNumber(raw)

   igv-utils.js

.. function:: numberFormatter(rawNumber)

   igv-utils.js

.. function:: numberUnFormatter(formatedNumber)

   igv-utils.js

.. function:: translateMouseCoordinates(e, target)

   igv-utils.js

.. function:: formatPopoverText(nameValueArray)

   igv-utils.js

.. function:: throttle(fn, threshhold, scope)

   igv-utils.js

.. function:: splitStringRespectingQuotes(string, delim)

   igv-utils.js

.. function:: addAjaxExtensions()

   igv-utils.js

.. function:: isStringOrNumber(value)

   igv-utils.js

.. function:: constrainBBox($child, $parent)

   igv-utils.js

.. function:: log(message)

   igv-utils.js

.. function:: navigateKaryo(mouseX, mouseY)

   karyo/karyo.js

.. function:: isBlank(line)

   parseUtils.js

.. function:: isComment(line)

   parseUtils.js

.. function:: getQueryValue(name)

   parseUtils.js

.. function:: configTrack(track, config)

   trackCore.js

.. function:: setTrackLabel(track, label)

   trackCore.js

.. function:: setTrackColor(track, color)

   trackCore.js

.. function:: paintAxis(ctx, pixelWidth, pixelHeight)

   trackCore.js

.. function:: trackPopupMenuItemList(popover, viewport, genomicLocation, xOffset, yOffset)

   trackCore.js

.. function:: trackMenuItemList(popover, trackView)

   trackCore.js

.. function:: trackMenuItem(popover, trackView, menuItemLabel, dialogLabelHandler, dialogInputValue, dialogClickHandler, doAddTopBorder)

   trackCore.js

.. function:: dataRangeMenuItem(popover, trackView)

   trackCore.js

.. function:: colorPickerMenuItem(popover, trackView)

   trackCore.js

.. function:: loadTribbleIndex(indexFile, config)

   feature/tribble.js

