/*
 * TODO(david): license
 */

var igv = (function (igv) {
    igv.CNVAccumTrack = function (config) {
        igv.configTrack(this, config);

        this.tolerance = config.tolerance || 0.01;
        this.accumulated = []

        this.selected = [];
        this.selectFrom = [];

        this.avgType = createAverage;

        this.avgName = "X Average",
        this.perName = "Percent",
        this.sumName = "Sum";

        var myself = this;
        if (igv.trackViews !== undefined) {
            igv.trackViews.filter(function (trackview) {
                return trackview.track.type === "seg";
            }).forEach(function (trackview) {
                myself.selectFrom.push(trackview.track)
            });
        }

        igv.browser.on('addtrack', this.addToSelectFrom(this));
        igv.browser.on('removetrack', this.removeFromSelectFrom(this));

        this.supportsWholeGenome = true;
    };

    igv.CNVAccumTrack.prototype.addToSelectFrom = function (thisObj) {
        return function (track) {
            if (track.type === "seg")
                thisObj.selectFrom.push({ isLog: false, track: track });
        };
    };

    igv.CNVAccumTrack.prototype.removeFromSelectFrom = function (thisObj) {
        /* TODO(david): fix removing
        return function (track) {
            if (thisObj.selectFrom.indexOf(track) > -1)
                thisObj.selectFrom.splice(thisObj.selectFrom.indexOf(track), 1);

            if (thisObj.selected.indexOf(track) > -1)
                thisObj.selected.splice(thisObj.selected.indexOf(track), 1);
        };
        */
    };

    igv.CNVAccumTrack.prototype.popupData = function (genomicLocation, xOffset, yOffset, referenceFrame) {
        var data = find(this.accumulated[0], genomicLocation);
        if (data > 0) {
            return [{name: "Value Positive", value: this.accumulated[0][data].value}, {name: "Value Negative", value: this.accumulated[1][data].value}];
        }
        return null;
    };

    igv.CNVAccumTrack.prototype.menuItemList = function (popover) {
        var myself = this,
            toggleList = [];

        this.selectFrom.forEach(function (track) {
            var i;
            for (i = 0; i < track.track.sampleCount; i++) {
                var name = track.track.sampleNames[i];
                var tName = (myself.selected.indexOf(name) > -1) ? "- " : "+ ";

                toggleList.push({
                    name: tName + name,
                    click: function (name) {
                        return function () {
                            popover.hide();
                            myself.toggleTrack((' ' + name).slice(1));
                        }
                    }(name)
                });
            }
        });

        toggleList.push({
            name: myself.avgName,
            click: function (name) {
                return function () {
                    popover.hide();
                    myself.avgName = "X Average",
                    myself.perName = "Percent",
                    myself.sumName = "Sum";
                    myself.avgType = createAverage;
                    myself.trackView.update();
                }
            }(name)
        });

        toggleList.push({
            name: myself.perName,
            click: function (name) {
                return function () {
                    popover.hide();
                    myself.avgName = "Average",
                    myself.perName = "X Percent",
                    myself.sumName = "Sum";
                    myself.avgType = createPercent;
                    myself.trackView.update();
                }
            }(name)
        });

        toggleList.push({
            name: myself.sumName,
            click: function (name) {
                return function () {
                    popover.hide();
                    myself.avgName = "Average",
                    myself.perName = "Percent",
                    myself.sumName = "X Sum";
                    myself.avgType = createSum;
                    myself.trackView.update();
                }
            }(name)
        });

        return toggleList;
    };

    igv.CNVAccumTrack.prototype.toggleTrack = function (sampleName) {
        var index = this.selected.indexOf(sampleName);
        if (index > -1)
            this.selected.splice(index, 1);
        else
            this.selected.push(sampleName);
        this.trackView.update();
    };

    igv.CNVAccumTrack.prototype.getFeatures = function (chr, bpStart, bpEnd) {
        var myself = this,
            promises = [],
            i;

        for (i = 0; i < this.selectFrom.length; i++) {
            if (this.selectFrom[i].track.sampleNames.some(function (a) {
                        return myself.selected.indexOf(a) > -1;
                    }))
                promises.push(myself.selectFrom[i].track.getFeatures(chr, bpStart, bpEnd));
        }

        return Promise.all(promises);
    };

    igv.CNVAccumTrack.prototype.draw = function (options) {
        var myself = this,
            featureLists,
            ctx,
            bpStart,
            bpEnd,
            bpPerPixel,
            pixelWidth,
            pixelHeight,
            yCenter,
            yMin = 0.0,
            yMax = 0.0,
            yScale,
            cnv,
            val,
            lineMaps,
            mean,
            x1,
            x2,
            y,
            color;

        ctx = options.context;
        pixelWidth = options.pixelWidth;
        pixelHeight = options.pixelHeight;

        igv.graphics.fillRect(ctx,
            0, 0, pixelWidth, pixelHeight,
            { 'fillStyle' : 'rgb(255, 255, 255)' });

        featureLists = [].concat.apply([], options.features);
        featureLists = featureLists.filter(function (a) {
                           var result = myself.selected.some(function (b) {
                               var result = (a.sample == b);
                               return result;
                           });
                           return result;
                       });
        featureLists = ensureLog(featureLists);
        if (featureLists) {
            bpPerPixel = options.bpPerPixel;
            bpStart    = options.bpStart;
            bpEnd      = bpStart + pixelWidth * bpPerPixel + 1;

            yCenter = pixelHeight / 2.0;
            igv.graphics.strokeLine(ctx,
                0         , yCenter,
                pixelWidth, yCenter,
                { 'color' : 'rgb(100, 100, 100)' });

            parsedLines = this.avgType.call(this, featureLists, bpStart, bpEnd, bpPerPixel);
            this.accumulated = parsedLines.lines;
            yScale = Math.max(-parsedLines.min, parsedLines.max) / yCenter;

            for (j = 0; j < 2; j++){
            for (i = 0; i < parsedLines.lines[j].length; i++) {
                cnv = parsedLines.lines[j][i];

                if (cnv.end < bpStart) continue;
                if (cnv.start > bpEnd) break;
                if (cnv.end - cnv.start < bpPerPixel) continue;

                if (Math.abs(cnv.value) < myself.tolerance) continue;

                y = yCenter - Math.round(cnv.value / yScale);

                x1 = Math.floor((cnv.start - bpStart) / bpPerPixel);
                x2 = Math.floor((cnv.end - bpStart) / bpPerPixel);
                xw = Math.ceil((cnv.end - cnv.start) / bpPerPixel);
                yh = y - yCenter;

                if (cnv.value < 0.0)
                    color = "rgb(255, 0, 0)";
                else
                    color = "rgb(0, 0, 255)";

                igv.graphics.strokeLine(ctx, x1, y, x2, y, {'strokeStyle': color}, 1);
                igv.graphics.fillRect(ctx, x1, yCenter, xw, yh, {'fillStyle': color});
            }
          }
        }
    };

    ensureLog = function (featureList) {
        var i,
            isLog = {},
            result = featureList;

        for (i = 0; i < featureList.length; i++) {
            if (isLog[featureList.sample] === undefined && featureList[i].value < 0.0) {
                isLog[featureList.sample] = true;
            }
        }

        for (i = 0; i < featureList.length; i++) {
            if (isLog[featureList.sample] === undefined) {
                result.value = Math.log2(result.value / 2);
            }
        }

        return result;
    };

    find = function (list, genomicLocation) {
        var len = list.length,
            l = 0, r = len, m;

        while (l <= r) {
            m = Math.floor((l + r) / 2);
            if (0 <= m && m < len) {
                if (list[m].end < genomicLocation)
                    l = m + 1;
                else if (list[m].start > genomicLocation)
                    r = m - 1;
                else
                    return m;
            } else {
                break;
            }
        }
        return -1;
    }

    createAverage = function (featureList, bpStart, bpEnd, bpPerPixel) {
        var i, j, k,
            cnv,
            mean,
            yMin = 0.0,
            yMax = 0.0,
            lineMapsP = [ { start  : Number.MIN_VALUE ,
                           end    : Number.MAX_VALUE ,
                           sum    : 0.0              ,
                           value  : 0.0              ,
                           data   : []               } ],
           lineMapsN = [ { start  : Number.MIN_VALUE ,
                          end    : Number.MAX_VALUE ,
                          sum    : 0.0              ,
                          value  : 0.0              ,
                          data   : []               } ],
            newMapsP, newMapsN, newMap, lineMaps,
            adjust;

        for (j = 0; j < featureList.length; j++) {
            cnv = featureList[j];
            if (cnv.end < bpStart || bpEnd < cnv.start)
                continue; // skip everything outside of the view

            getAdjust = function (list, start, end) {
                var left  = find(list, start),
                    right = find(list, end);

                if (left >= 0 && right >= 0)
                    return { index: left, count: right - left + 1, data: list.slice(left, right + 1) };
                else
                    return null;
            };

            adjustP = getAdjust(lineMapsP, cnv.start, cnv.end);
            if (adjust === null)
                console.log("adjust error");

            adjustN = getAdjust(lineMapsN, cnv.start, cnv.end);
            if (adjust === null)
                console.log("adjust error");

            newMapsP = [];
            newMapsN = [];

            if (adjustP.count < 1 || adjustN.count < 1) {
                console.log("create average error: " + cnv);
                return [];
            }

            newMap = {};
            newMap.start = adjustP.data[0].start;
            newMap.end   = cnv.start;
            newMap.sum   = adjustP.data[0].sum;
            newMap.value = newMap.sum / this.selected.length;
            newMapsP.push(newMap);

            newMap = {};
            newMap.start = adjustN.data[0].start;
            newMap.end   = cnv.start;
            newMap.sum   = adjustN.data[0].sum;
            newMap.value = newMap.sum / this.selected.length;
            newMapsN.push(newMap);

            for (i = 0; i < adjustP.count; i++) {
                newMap = {};
                newMap.start = Math.max(cnv.start, adjustP.data[i].start);
                newMap.end   = Math.min(cnv.end,   adjustP.data[i].end);
                newMap.sum   = adjustP.data[i].sum;
                if (cnv.value > 0)
                  newMap.sum   = newMap.sum + cnv.value;
                newMap.value = newMap.sum / this.selected.length;
                newMapsP.push(newMap);
            }

            for (i = 0; i < adjustN.count; i++) {
                newMap = {};
                newMap.start = Math.max(cnv.start, adjustN.data[i].start);
                newMap.end   = Math.min(cnv.end,   adjustN.data[i].end);
                newMap.sum   = adjustN.data[i].sum;
                if (cnv.value < 0)
                  newMap.sum   = newMap.sum +cnv.value;
                newMap.value = newMap.sum / this.selected.length;
                newMapsN.push(newMap);
            }

            newMap = {};
            newMap.start = cnv.end;
            newMap.end   = adjustP.data[adjustP.count - 1].end;
            newMap.sum   = adjustP.data[adjustP.count - 1].sum;
            newMap.value = newMap.sum / this.selected.length;
            newMapsP.push(newMap);

            newMap = {};
            newMap.start = cnv.end;
            newMap.end   = adjustN.data[adjustN.count - 1].end;
            newMap.sum   = adjustN.data[adjustN.count - 1].sum;
            newMap.value = newMap.sum / this.selected.length;
            newMapsN.push(newMap);

            newMapsP = [adjustP.index, adjustP.count].concat(newMapsP);
            newMapsN = [adjustN.index, adjustN.count].concat(newMapsN);
            lineMapsP["splice"].apply(lineMapsP, newMapsP);
            lineMapsN["splice"].apply(lineMapsN, newMapsN);
        }

        for (i = 0; i < lineMapsN.length; i++) {
            yMin = Math.min(yMin, lineMapsN[i].value);
        }

        for (i = 0; i < lineMapsP.length; i++) {
            yMax = Math.max(yMax, lineMapsP[i].value);
        }

        lineMaps = [lineMapsP, lineMapsN];

        return {
            min: yMin,
            max: yMax,
            lines: lineMaps
        };
    };

    createPercent = function (featureList, bpStart, bpEnd, bpPerPixel) {
        var i, j, k,
            cnv,
            mean,
            yMin = 0.0,
            yMax = 0.0,
            lineMapsP = [ { start  : Number.MIN_VALUE ,
                           end    : Number.MAX_VALUE ,
                           sum    : 0.0              ,
                           value  : 0.0              ,
                           data   : []               } ],
           lineMapsN = [ { start  : Number.MIN_VALUE ,
                          end    : Number.MAX_VALUE ,
                          sum    : 0.0              ,
                          value  : 0.0              ,
                          data   : []               } ],
            newMapsP, newMapsN, newMap, lineMaps,
            adjust;

        for (j = 0; j < featureList.length; j++) {
            cnv = featureList[j];
            if (cnv.end < bpStart || bpEnd < cnv.start)
                continue; // skip everything outside of the view

            getAdjust = function (list, start, end) {
                var left  = find(list, start),
                    right = find(list, end);

                if (left >= 0 && right >= 0)
                    return { index: left, count: right - left + 1, data: list.slice(left, right + 1) };
                else
                    return null;
            };

            adjustP = getAdjust(lineMapsP, cnv.start, cnv.end);
            if (adjust === null)
                console.log("adjust error");

            adjustN = getAdjust(lineMapsN, cnv.start, cnv.end);
            if (adjust === null)
                console.log("adjust error");

            newMapsP = [];
            newMapsN = [];

            if (adjustP.count < 1 || adjustN.count < 1) {
                console.log("create average error: " + cnv);
                return [];
            }

            newMap = {};
            newMap.start = adjustP.data[0].start;
            newMap.end   = cnv.start;
            newMap.sum   = adjustP.data[0].sum;
            newMap.value = newMap.sum / this.selected.length;
            newMapsP.push(newMap);

            newMap = {};
            newMap.start = adjustN.data[0].start;
            newMap.end   = cnv.start;
            newMap.sum   = adjustN.data[0].sum;
            newMap.value = newMap.sum / this.selected.length;
            newMapsN.push(newMap);

            for (i = 0; i < adjustP.count; i++) {
                newMap = {};
                newMap.start = Math.max(cnv.start, adjustP.data[i].start);
                newMap.end   = Math.min(cnv.end,   adjustP.data[i].end);
                newMap.sum   = adjustP.data[i].sum;
                if (cnv.value > 0)
                  newMap.sum   = newMap.sum + 1;
                newMap.value = newMap.sum / this.selected.length;
                newMapsP.push(newMap);
            }

            for (i = 0; i < adjustN.count; i++) {
                newMap = {};
                newMap.start = Math.max(cnv.start, adjustN.data[i].start);
                newMap.end   = Math.min(cnv.end,   adjustN.data[i].end);
                newMap.sum   = adjustN.data[i].sum;
                if (cnv.value < 0)
                  newMap.sum   = newMap.sum - 1;
                newMap.value = newMap.sum / this.selected.length;
                newMapsN.push(newMap);
            }

            newMap = {};
            newMap.start = cnv.end;
            newMap.end   = adjustP.data[adjustP.count - 1].end;
            newMap.sum   = adjustP.data[adjustP.count - 1].sum;
            newMap.value = newMap.sum / this.selected.length;
            newMapsP.push(newMap);

            newMap = {};
            newMap.start = cnv.end;
            newMap.end   = adjustN.data[adjustN.count - 1].end;
            newMap.sum   = adjustN.data[adjustN.count - 1].sum;
            newMap.value = newMap.sum / this.selected.length;
            newMapsN.push(newMap);

            newMapsP = [adjustP.index, adjustP.count].concat(newMapsP);
            newMapsN = [adjustN.index, adjustN.count].concat(newMapsN);
            lineMapsP["splice"].apply(lineMapsP, newMapsP);
            lineMapsN["splice"].apply(lineMapsN, newMapsN);
        }

        for (i = 0; i < lineMapsN.length; i++) {
            yMin = Math.min(yMin, lineMapsN[i].value);
        }

        for (i = 0; i < lineMapsP.length; i++) {
            yMax = Math.max(yMax, lineMapsP[i].value);
        }

        lineMaps = [lineMapsP, lineMapsN];

        return {
            min: yMin,
            max: yMax,
            lines: lineMaps
        };
    };

    createSum = function (featureList, bpStart, bpEnd, bpPerPixel) {
        var i, j, k,
            cnv,
            mean,
            yMin = 0.0,
            yMax = 0.0,
            lineMapsP = [ { start  : Number.MIN_VALUE ,
                           end    : Number.MAX_VALUE ,
                           sum    : 0.0              ,
                           value  : 0.0              ,
                           data   : []               } ],
           lineMapsN = [ { start  : Number.MIN_VALUE ,
                          end    : Number.MAX_VALUE ,
                          sum    : 0.0              ,
                          value  : 0.0              ,
                          data   : []               } ],
            newMapsP, newMapsN, newMap, lineMaps,
            adjust;

        for (j = 0; j < featureList.length; j++) {
            cnv = featureList[j];
            if (cnv.end < bpStart || bpEnd < cnv.start)
                continue; // skip everything outside of the view

            getAdjust = function (list, start, end) {
                var left  = find(list, start),
                    right = find(list, end);

                if (left >= 0 && right >= 0)
                    return { index: left, count: right - left + 1, data: list.slice(left, right + 1) };
                else
                    return null;
            };

            adjustP = getAdjust(lineMapsP, cnv.start, cnv.end);
            if (adjust === null)
                console.log("adjust error");

            adjustN = getAdjust(lineMapsN, cnv.start, cnv.end);
            if (adjust === null)
                console.log("adjust error");

            newMapsP = [];
            newMapsN = [];

            if (adjustP.count < 1 || adjustN.count < 1) {
                console.log("create average error: " + cnv);
                return [];
            }

            newMap = {};
            newMap.start = adjustP.data[0].start;
            newMap.end   = cnv.start;
            newMap.sum   = adjustP.data[0].sum;
            newMap.value = newMap.sum;
            newMapsP.push(newMap);

            newMap = {};
            newMap.start = adjustN.data[0].start;
            newMap.end   = cnv.start;
            newMap.sum   = adjustN.data[0].sum;
            newMap.value = newMap.sum;
            newMapsN.push(newMap);

            for (i = 0; i < adjustP.count; i++) {
                newMap = {};
                newMap.start = Math.max(cnv.start, adjustP.data[i].start);
                newMap.end   = Math.min(cnv.end,   adjustP.data[i].end);
                newMap.sum   = adjustP.data[i].sum;
                if (cnv.value > 0)
                  newMap.sum   = newMap.sum + cnv.value;
                newMap.value = newMap.sum;
                newMapsP.push(newMap);
            }

            for (i = 0; i < adjustN.count; i++) {
                newMap = {};
                newMap.start = Math.max(cnv.start, adjustN.data[i].start);
                newMap.end   = Math.min(cnv.end,   adjustN.data[i].end);
                newMap.sum   = adjustN.data[i].sum;
                if (cnv.value < 0)
                  newMap.sum   = newMap.sum + cnv.value;
                newMap.value = newMap.sum;
                newMapsN.push(newMap);
            }

            newMap = {};
            newMap.start = cnv.end;
            newMap.end   = adjustP.data[adjustP.count - 1].end;
            newMap.sum   = adjustP.data[adjustP.count - 1].sum;
            newMap.value = newMap.sum;
            newMapsP.push(newMap);

            newMap = {};
            newMap.start = cnv.end;
            newMap.end   = adjustN.data[adjustN.count - 1].end;
            newMap.sum   = adjustN.data[adjustN.count - 1].sum;
            newMap.value = newMap.sum;
            newMapsN.push(newMap);

            newMapsP = [adjustP.index, adjustP.count].concat(newMapsP);
            newMapsN = [adjustN.index, adjustN.count].concat(newMapsN);
            lineMapsP["splice"].apply(lineMapsP, newMapsP);
            lineMapsN["splice"].apply(lineMapsN, newMapsN);
        }

        for (i = 0; i < lineMapsN.length; i++) {
            yMin = Math.min(yMin, lineMapsN[i].value);
        }

        for (i = 0; i < lineMapsP.length; i++) {
            yMax = Math.max(yMax, lineMapsP[i].value);
        }

        lineMaps = [lineMapsP, lineMapsN];

        return {
            min: yMin,
            max: yMax,
            lines: lineMaps
        };
    };

    return igv;
}) (igv || {});
