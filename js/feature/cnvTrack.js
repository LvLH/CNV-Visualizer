/* TODO(david): license
 */

var igv = (function (igv) {
    /* Configure the CNVTrack, initializing the reader, samples and display */
    igv.CNVTrack = function (config) {
        igv.configTrack(this, config);

        this.displayMode = config.displayMode || "BAR"; // BAR | DOT

        this.sampleName = null;
        this.samples = {};

        // TODO(david): create a parser for this
        this.featureSource = new igv.FeatureSource(this.config);

        this.supportsWholeGenome = true;
    };

    /* Get a list of items to be included in the menu (gear icon) next to the track */
    igv.CNVTrack.prototype.menuItemList = function (popover) {
        var _this = this;

        return [
            {
                name: ("BAR" === this.displayMode) ? "Show Dots" : "Show Bars";
                click: function () {
                    popover.hide();
                    _this.toggleBarDots();
                }
            }
        ];
    };

    /* Toggle view mode between bars over range, or dots representing center of the range */
    igv.CNVTrack.prototype.toggleBarDots = function () {
        this.displayMode = ("BAR" === this.displayMode) ? "DOT" : "BAR";
        this.trackView.update();
    };

    /* grab the features for the current view */
    igv.CNVTrack.prototype.getFeatures = function (chr, bpStart, bpEnd) {
        var _this = this;

        return new Promise(function (fulfill, reject) {
            // have to grab features if there are no samples
            self.featureSource
                .getFeatures(chr, bpStart, bpEnd)
                .then(fulfill)
                .catch(reject);
        });
    };

    /* draw the track */
    igv.CNVTrack.prototype.draw = function (options) {
        var _this = this,
            featureList,
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
            x1,
            x2,
            y;

        ctx = options.context;
        pixelWidth = options.pixelWidth;
        pixelHeight = options.pixelHeight;
        
        igv.graphics.fillRect(ctx,
            0, 0, pixelWidth, pixelHeight,
            {'fillStyle': 'rgb(255, 255, 255)'});

        featureList = options.features;
        if (featureList) {
            bpPerPixel = options.bpPerPixel;
            bpStart = options.bpStart;
            bpEnd = bpStart + pixelWidth * bpPerPixel + 1;

            yCenter = pixelHeight / 2.0;
            igv.graphics.strokeLine(ctx,
                0,          yCenter,
                pixelWidth, yCenter,
                {'color': 'rgb(100, 100, 100)'});

            for (i = 0; i < featureList.length; i++) {
                yMin = Math.min(yMin, featureList[i].log2val);
                yMax = Math.max(yMax, featureList[i].log2val);
            }
            yScale = Math.max(-yMin, yMax) / yCenter;

            for (i = 0; i < featureList.length; i++) {
                cnv = featureList[i];

                if (cnv.end < bpStart) continue;
                if (cnv.start > bpEnd) break;

                if (Math.abs(cnv.log2val) < _this.tolerance) continue;

                y = yCenter + Math.round(cnv.log2val / yScale);

                if (_this.displayMode === "BAR") {
                    x1 = Math.round((cnv.start - bpStart) / xScale);
                    x2 = Math.round((cnv.end - bpstart) / xScale);
                    igv.graphics.strokeLine(ctx, x1, y, x2, y, {'fillStyle': 'rgb(0, 0, 255)'});
                }
                else {
                    x1 = Math.round((cnv.end + cnv.start) / (2 * xScale));
                    igv.graphics.fillCircle(ctx, x1, y, 5, {'fillStyle': 'rgb(0, 0, 255)'});
                }
            }
    };

    return igv;
})(igv || {});
