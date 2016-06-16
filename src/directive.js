/* globals Hammer, Image */
'use strict';

angular.module('angularPixelPaint', []).directive('pixelPaint', ['$document', '$window', '$q', '$timeout', '$log', function ($document, $window, $q, $timeout, $log) {
  //var value = 0;

  var directive = {
    restrict: 'E',
    scope: {
      'layers': '=',
      'options': '=',
      'shouldGenerateOutputImage': '=',
      'outputImage': '=',
      'revision': '='
    },
    template: '<div class="layers-container"></div>',
    link: linkFunc
  };

  function linkFunc(scope, el) {
    var optionsWatcher, layersWatcher, outputImageFlagWatcher, revisionWatcher;

    var defaultCanvas = $document[0].createElement('canvas');
    var defaultContext = defaultCanvas.getContext('2d');
    el.addClass('pixelpaint');
    var layersContainer = angular.element(el[0].querySelector('.layers-container'));

    /** 
     * Instance Variables
     */
    var layers = [],
        options = {
          cellSize: 10,
          largeGridEvery: 10,
          gridLineWidth: 1,
          gridSubDivisionLineWidth: 0.5,
          imageWidth: 54,
          imageHeight: 36,
          showGrid: true,
          brushColor: [0,0,0],
          paintEnabled: true
        },
        panStartPos = {x:0, y: 0},
        panStartLayerOffset = {x:0, y:0},
        revisions = [];

    optionsWatcher = scope.$watch('options', function(newValue, oldValue) {
      options = Object.assign(options, scope.options);

      // If cell size did changed
      if(newValue.cellSize !== oldValue.cellSize){
        angular.forEach(layers, function(layer) {
          layer.element[0].width = options.imageWidth * options.cellSize;
          layer.element[0].height = options.imageHeight * options.cellSize;
          layer.element[0].style.transform = 'translate(' + 
                                              (layer.offset.x * options.cellSize) + 'px,' +
                                              (layer.offset.y * options.cellSize) + 'px)';
          redrawLayer(layer);
        });

      }

      el.css('width', options.imageWidth * options.cellSize + 'px');
      el.css('height', options.imageHeight * options.cellSize + 'px');
    }, true);

    layersWatcher = scope.$watch('layers', function(newValue, oldValue) {
      syncLayers(newValue, oldValue);
    }, true);

    outputImageFlagWatcher = scope.$watch('shouldGenerateOutputImage', function(newValue) {
      if(newValue){
        $log.info('shouldGenerateOutputImage');
        renderLayers();
        $timeout(function() {
          scope.shouldGenerateOutputImage = false;
        });
      }
    });

    revisionWatcher = scope.$watch('revision', function(newValue) {
      //setRevision(newValue);
    });

    var hammer = new Hammer(el[0]);

    hammer.on('tap', function(ev) { onTap(ev); });
    hammer.on('panstart', function(ev) { onPanStart(ev); });
    hammer.on('panmove', function(ev) { onPanMove(ev); });
    hammer.on('panend', function(ev) { onPanEnd(ev); });

    /**
     * synchronizes layer information
     */ 
    var syncLayers = function(newLayers, oldLayers) {

      angular.forEach(newLayers, function(newLayer, index) {
        if(angular.isDefined(oldLayers) && index < oldLayers.length){
          // See if layer have changed
          if(!angular.equals(oldLayers[index], newLayer)) {
            createLayer(newLayer, index);
          }
        }else {
          createLayer(newLayer);
        }
        //
      });

    };

    /**
     * Creates a new layer
     */ 
    var createLayer = function(newLayer, index) {
      
      var defaultLayer = {
        offset: {x: 0, y:0}
      };
      if(index < layers.length){
        if(layers[index].type === 'text'){
          defaultLayer.offset = layers[index].offset;
        }
      }

      var layer = Object.assign({}, newLayer, defaultLayer);

      layer.element = angular.element('<canvas></canvas>');
      
      if(layer.type === 'text'){
        layer.element.addClass('text');
      }

      layer.element[0].width = options.imageWidth * options.cellSize;
      layer.element[0].height = options.imageHeight * options.cellSize;
      layer.element[0].style.transform = 'translate(' + 
                                            (layer.offset.x * options.cellSize) + 'px,' +
                                            (layer.offset.y * options.cellSize) + 'px)';

      layer.imageData = defaultContext.createImageData(options.imageWidth, options.imageHeight); 
      
      if(angular.isDefined(index)){ 
        layers[index] = layer;
        layersContainer.find('canvas').eq(index).replaceWith(layer.element);
      }
      else {
        layers.push(layer);
        layersContainer.append(layer.element);
      }
      redrawLayer(layer);
    };

    /**
     *  load an image (base 64 string) and turn it into ImageData. Returns a promise
     */
    var loadImageData = function(inputImageBase64) {
      var d = $q.defer();  
      var img = new Image();
      img.onload = function() {
          var canvas = $document[0].createElement('canvas');
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          var imgData = ctx.getImageData(0, 0, options.imageWidth, options.imageHeight);
          d.resolve(imgData);
      };

      img.onerror = function() {
        d.reject();
      };
      img.src = inputImageBase64;
      return d.promise;
    };

    var imageDataToCanvas = function(imgData) {
      var outCanvas = $document[0].createElement('canvas');
      outCanvas.width = imgData.width;
      outCanvas.height = imgData.height;
      var outCtx = outCanvas.getContext('2d');
      outCtx.putImageData(imgData, 0, 0);
      return outCanvas;
    };

    /**
     * set color of a pixel in ImageData
     */
    var setImagePixel = function(imageData, x, y, r, g, b, a) {
        var ptr = ((y*imageData.width) + x) * 4;
        imageData.data[ptr] = r;
        imageData.data[ptr + 1] = g;
        imageData.data[ptr + 2] = b;
        imageData.data[ptr + 3] = a;
    };

    /**
     *  get the currently active layer or the first layer
     */
    var getActiveLayer = function() {
      var activeLayer = layers[0];
      angular.forEach(layers, function(layer) {
        if(layer.active)
          activeLayer = layer;
      });
      return activeLayer;
    };

    /**
     * set the currently active layer
     */
    var setActiveLayer = function(index) {
      angular.forEach(layers, function(layer, i) {
        if(i === index) {
          layer.active = true;
          layer.element.addClass('active');
        }
        else {
          layer.active = false;
          layer.element.removeClass('active');
        }
      });
    };

    /**
     * handles paint event
     */
    var onPaint = function(ev) {
      var activeLayer = getActiveLayer();
      if(ev.pointers.length > 0){
          var paintRect = activeLayer.element[0].getBoundingClientRect();
          var px = ev.pointers[0].clientX - paintRect.left;
          var py = ev.pointers[0].clientY - paintRect.top;
          var cellX = Math.floor(px / options.cellSize);
          var cellY = Math.floor(py / options.cellSize);

          if(options.paintEnabled /* && cellX < this.image.width && cellY <= this.image.height */){
              setImagePixel(activeLayer.imageData, cellX, cellY, 
                  options.brushColor[0],
                  options.brushColor[1],
                  options.brushColor[2],255);
              redrawPixel(activeLayer, cellX, cellY, 
                  options.brushColor[0],
                  options.brushColor[1],
                  options.brushColor[2],255);
          }
      }
    };

    /**
     * handles tap event from HammerJS
     */
    var onTap = function(ev) {
      
      var activeLayer = getActiveLayer();

      if(ev.target === activeLayer.element[0]){
        if(activeLayer.type !== 'text'){
          onPaint(ev);
        }
      }else{
        // Active elem changed
        var selectedIndex;
        angular.forEach(layers, function(layer, index) {
          if(layer.element[0] === ev.target){
            selectedIndex = index;
          }
        });

        setActiveLayer(selectedIndex);
      }
      
    };

    /**
     * handles pan start from HammerJS
     */
    var onPanStart = function(ev) {
      var activeLayer = getActiveLayer();
      if(activeLayer.type === 'text'){
        panStartPos.x = ev.pointers[0].clientX;
        panStartPos.y = ev.pointers[0].clientY;
        panStartLayerOffset.x = activeLayer.offset.x;
        panStartLayerOffset.y = activeLayer.offset.y;
      } else {
        onPaint(ev);
      }
    };

    /**
     * handles pan event from HammerJS
     */
    var onPanMove = function(ev) {
      var activeLayer = getActiveLayer();
      if(activeLayer.type === 'text'){
        var newRawPosX = (panStartLayerOffset.x * options.cellSize) + (ev.pointers[0].clientX - panStartPos.x);
        var newRawPosY = (panStartLayerOffset.y * options.cellSize) + (ev.pointers[0].clientY - panStartPos.y);

        activeLayer.offset.x = Math.floor(newRawPosX / options.cellSize);
        activeLayer.offset.y = Math.floor(newRawPosY / options.cellSize);
        
        activeLayer.element[0].style.transform = 'translate(' + 
                                                  (activeLayer.offset.x * options.cellSize) + 'px,' +
                                                  (activeLayer.offset.y * options.cellSize) + 'px)';
      } else {
        onPaint(ev);
      }
    };

    var onPanEnd = function() {
      //addRevision();
    };

    /**
     * Redraw any type of layer
     */
    var redrawLayer = function(layer) {
      if(layer.type === 'image'){
        if(layer.image){
          loadImageData(layer.image).then(function(imageData) {
            layer.imageData = imageData;
            redrawImageLayer(layer);
          });
        }
        redrawImageLayer(layer);
      }else if(layer.type === 'text'){
        redrawTextLayer(layer);
      }
    };

    /**
     * Redraw a text layer
     */
    var redrawTextLayer = function(layer) {
      var $canvas = angular.element('<canvas></canvas>');
      var canvas = $canvas[0];
      canvas.width = options.imageWidth;
      canvas.height = options.imageHeight;
      var ctx = canvas.getContext('2d');

      if ($window.devicePixelRatio) {
        var hidefCanvasWidth = $canvas.attr('width');
        var hidefCanvasHeight = $canvas.attr('height');
        var hidefCanvasCssWidth = hidefCanvasWidth;
        var hidefCanvasCssHeight = hidefCanvasHeight;
    
        $canvas.attr('width', hidefCanvasWidth * $window.devicePixelRatio);
        $canvas.attr('height', hidefCanvasHeight * $window.devicePixelRatio);
        $canvas.css('width', hidefCanvasCssWidth);
        $canvas.css('height', hidefCanvasCssHeight);
        ctx.scale($window.devicePixelRatio, $window.devicePixelRatio);               
      }
      
      var fontSize = (layer.fontSize || "10px");
      ctx.font = fontSize + ' ' + (layer.fontFamily || "Arial"); 
      var text = layer.text || "text";
      ctx.textBaseline = 'top';
      ctx.fillStyle = layer.color;
      ctx.fillText(text, 0, 0);

      // Settings the correct bounds
      var size = ctx.measureText(text);
      layer.element[0].width = size.width * options.cellSize;
      layer.element[0].height = parseInt(fontSize) * options.cellSize;

      layer.imageData = ctx.getImageData(0, 0, options.imageWidth, options.imageHeight);

      // Fixing alpha
      var ptr;
      for(var i=0; i< layer.imageData.height; i++){
        for(var j=0; j< layer.imageData.width; j++){
            ptr = ((i* layer.imageData.width) + j) * 4;
            layer.imageData.data[ptr+3] = layer.imageData.data[ptr+3] > 50 ? 255 : 0;
        }
      }

      redrawImageLayer(layer);

    };

    /**
     * Redraw an image layer
     */
    var redrawImageLayer = function(layer) {
      //var imgData = layer.imgData;
      var ctx = layer.element[0].getContext('2d'),
          ptr, r, g, b, a, alpha, gridSpaceX, gridSpaceY;
      
      ctx.clearRect(0, 0, layer.element[0].width, layer.element[0].height);
      for(var i=0; i< layer.imageData.height; i++){
          for(var j=0; j< layer.imageData.width; j++){
              ptr = ((i* layer.imageData.width) + j) * 4;
              r = layer.imageData.data[ptr];
              g = layer.imageData.data[ptr+1];
              b = layer.imageData.data[ptr+2];
              alpha = layer.imageData.data[ptr+3];
              
              //a = (alpha > 50) ? 1 : 0;
              a = alpha / 255;

              if(options.showGrid){
                  gridSpaceX = options.gridSubDivisionLineWidth;
                  gridSpaceY = options.gridSubDivisionLineWidth;
                  if(j % options.largeGridEvery === 0){
                      gridSpaceX = options.gridLineWidth;
                  }

                  if(i % options.largeGridEvery === 0){
                      gridSpaceY = options.gridLineWidth;
                  }

                  ctx.fillStyle = 'rgba(' + r + ',' + g + ', ' + b + ', ' + a + ')';
                  ctx.fillRect(   0.5 + options.cellSize * j + options.gridSubDivisionLineWidth + gridSpaceX, 
                                  0.5 + options.cellSize * i + options.gridSubDivisionLineWidth + gridSpaceY, 
                                  options.cellSize - (options.gridSubDivisionLineWidth * 2) - gridSpaceX, 
                                  options.cellSize - (options.gridSubDivisionLineWidth * 2) - gridSpaceY);
              }else{
                  ctx.fillStyle = 'rgba(' + r + ',' + g + ', ' + b + ', ' + a + ')';
                  ctx.fillRect(options.cellSize * j, options.cellSize * i, 
                              options.cellSize, options.cellSize);
              }
          }
      }
    };

    /**
     * Redraw a pixel in a layer
     */
    var redrawPixel = function(layer, x,y,r,g,b,a) {
        var ctx = layer.element[0].getContext('2d');
        ctx.fillStyle = 'rgba(' + r + ',' + g + ', ' + b + ', ' + a + ')';

        if(options.showGrid){
            var gridSpaceX = options.gridSubDivisionLineWidth;
            var gridSpaceY = options.gridSubDivisionLineWidth;
            if(x % options.largeGridEvery === 0){
                gridSpaceX = options.gridLineWidth;
            }

            if(y % options.largeGridEvery === 0){
                gridSpaceY = options.gridLineWidth;
            }

            ctx.fillRect(0.5 + options.cellSize * x + options.gridSubDivisionLineWidth + gridSpaceX, 
                         0.5 + options.cellSize * y + options.gridSubDivisionLineWidth + gridSpaceY, 
                            options.cellSize - (options.gridSubDivisionLineWidth * 2) - gridSpaceX, 
                            options.cellSize - (options.gridSubDivisionLineWidth * 2) - gridSpaceY);
        }else{
            ctx.fillRect(options.cellSize * x, options.cellSize * y, options.cellSize, options.cellSize);
        }
    };

    /**
     * render layers into one layer
     */
    var renderLayers = function() {      
      var $canvas = angular.element('<canvas></canvas>');
      var canvas = $canvas[0];
      canvas.width = options.imageWidth;
      canvas.height = options.imageHeight;
      var ctx = canvas.getContext('2d');

      angular.forEach(layers, function(layer) {
        ctx.drawImage(imageDataToCanvas(layer.imageData), layer.offset.x, layer.offset.y);
      });

      scope.outputImage = ctx.getImageData(0, 0, options.imageWidth, options.imageHeight);

    };

    /**
     * add a new revision
     */
    var addRevision = function() {
      revisions.push(Object.assign({}, {layers: layers}));
    };

    /**
     * set current revision
     */
    var setRevision = function(revision) {
      layers = revisions[revision];

      angular.forEach(layers, function(layer) {
        layer.element[0].width = options.imageWidth * options.cellSize;
        layer.element[0].height = options.imageHeight * options.cellSize;
        layer.element[0].style.transform = 'translate(' + 
                                            (layer.offset.x * options.cellSize) + 'px,' +
                                            (layer.offset.y * options.cellSize) + 'px)';
        redrawLayer(layer);
      });
    };

    scope.$on('$destroy', function() {
      optionsWatcher();
      layersWatcher();
      outputImageFlagWatcher();
      revisionWatcher();
    });

    // Init code
    syncLayers(scope.layers, []);
  }

  return directive;
}]);
