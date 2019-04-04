$(function(){

   
   var GROUP_DISTANCE = 80; // distance between original array block and sorted array block
   var SVG_WIDTH = 1000; // svg width
   var SVG_HEIGHT = 150; // svg height
   var MAX_RAND_NUMBER = 99; //maximum random number
   var TXT_Y_CORRECTION = 5; // corection for text

   var circleDistance = 50; //distance between circles
   var circleR = 20; //radius
   var coordY = 20; // Y coordinate for circles and text in block
   var coordX = 20; // Y coordinate for circles and text in block
   

   var originalArray = [];
   var visualArray = {};
   
   //classes css for visual representation of array's element

   var ACTIVE_GROUP = 'activeGroup';
   var STANDART_GROUP = 'standartGroup';  
   var ORIGINAL_GROUP = 'originalGroup';
   var SWAP_GROUP = 'swapGroup';

   //id for array's block

   var ORIGINAL = 'original';
   var SORTED = 'sorted';
   

   // bind functions to button events
   
   $('button#generateArray').click(function(){
      
      var n = $('select#selectArrayLen').val();
      
      originalArray = generateArray(n);
      createVisualization(originalArray);


      $('button#generateArray').attr('disabled', true)
         .attr('class', 'disabledButtons');
      $('button#startSort').attr('disabled', false)
         .attr('class', 'activeButtons');
      $('button#clearSvg').attr('disabled', false)
         .attr('class', 'activeButtons');

   });
               
   $('button#startSort').click(function(){
      
      $('button#startSort').attr('disabled', true)
         .attr('class', 'disabledButtons');
      
      //copy original array for sorting 
      copyArray();
      // wait aome time and start sorting
      setTimeout(function(){
         visualArray = new VisualArrayClass(originalArray, 
         SORTED, STANDART_GROUP, ACTIVE_GROUP, SWAP_GROUP, circleDistance);
         visualArray.bubbleSort();
      }, 1000);

   });

   $('button#clearSvg').click(function(){
      
      $('button#clearSvg').attr('disabled', true)
         .attr('class', 'disabledButtons');
      $('button#startSort').attr('disabled', true)
         .attr('class', 'disabledButtons');
      $('button#generateArray').attr('disabled', false)
         .attr('class', 'activeButtons');   

      clearSvg();

   });


   // class VisualArrayClass
   // represents an array visualization with SVG

   function VisualArrayClass(data, sortedGroupId, standartGroup,
      activeGroup, swapGroup, circleDistance){


      //set array data
      this._data = data;
      this._len = data.length;
      
      //styles of elements
      this._standartGroup = standartGroup;
      this._activeGroup = activeGroup;
      this._swapGroup = swapGroup;
      

      //find <g> group with sorted array data 
      this._sortedGroup = d3.select('#' + sortedGroupId);
      this._dx = circleDistance;   

      //animation functions  
      this._animations = [];
      this._swapDuration = 500; 
      this._animationDuration = 700;
      this._animationQueue = $({}); 
      //this._timeoutQueue = null;// saves queue timeout
   }
   

   // method swapAnimation
   VisualArrayClass.prototype.swapAnimation = function(id1, id2){
      
      var obj = this;

      //find elements by id
      var elem1 = this._sortedGroup.select('#g' + id1);
      var elem2 = this._sortedGroup.select('#g' + id2);

      // change element's style
      elem1.selectAll('circle')
         .attr('class', this._swapGroup + 'Circle'); 
      elem1.selectAll('text')
         .attr('class', this._swapGroup + 'Text');

      elem2.selectAll('circle')
         .attr('class', this._swapGroup + 'Circle'); 
      elem2.selectAll('text')
         .attr('class', this._swapGroup + 'Text'); 

      // move elements
      elem1.transition()
         .duration(this._swapDuration)
         .attr('transform', function (d, i){
            return "translate(" + (id2 * obj._dx) + ", 0)";
         })
         .attr('id', 'g' + id2);

      elem2.transition()
         .duration(this._swapDuration)
         .attr('transform', function (d){
            return "translate(" + (id1 * obj._dx) + ", 0)";
         })
         .attr('id', 'g' + id1); 

   };

   // method compareAnimationStart
   // change style of comparing elements to active
   VisualArrayClass.prototype.compareAnimationStart = function(id1, id2){
     
      var elem1 = this._sortedGroup.select('#g' + id1);

      elem1.selectAll('circle')
         .attr('class', this._activeGroup + 'Circle'); 
      elem1.selectAll('text')
         .attr('class', this._activeGroup + 'Text');

      var elem2 = this._sortedGroup.select('#g' + id2);

      elem2.selectAll('circle')
         .attr('class', this._activeGroup + 'Circle'); 
      elem2.selectAll('text')
         .attr('class', this._activeGroup + 'Text'); 

   };

   // method compareAnimationStop
   // change style of comparing elements to standart
   VisualArrayClass.prototype.compareAnimationStop = function(id1, id2){
      
      var elem1 = this._sortedGroup.select('#g' + id1);

      elem1.selectAll('circle')
         .attr('class', this._standartGroup + 'Circle'); 
      elem1.selectAll('text')
         .attr('class', this._standartGroup + 'Text');   

      var elem2 = this._sortedGroup.select('#g' + id2);

      elem2.selectAll('circle')
         .attr('class', this._standartGroup + 'Circle'); 
      elem2.selectAll('text')
         .attr('class', this._standartGroup + 'Text'); 

   };

   // method formAnimationQueue
   
   VisualArrayClass.prototype.formAnimationQueue = function(){

      var animations = this._animations;

      var obj = this;


      // for each element in array _animationQueue add function to a jquery queue
      animations.forEach(function(elem, idx){
         obj._animationQueue.queue('sortAnimation', function(next){

            if(elem.event == 'compareAnimationStart'){

               obj.compareAnimationStart(elem.id1, elem.id2);
            
            } else if(elem.event == 'swapAnimation'){

               obj.swapAnimation(elem.id1, elem.id2);

            } else if(elem.event == 'compareAnimationStop'){

               obj.compareAnimationStop(elem.id1, elem.id2);

            }

            // run next function in queue
            next();

         });
         // animation delay
         obj._animationQueue.delay(obj._animationDuration, 'sortAnimation');

      });   


      // start animation queue
      obj._animationQueue.dequeue('sortAnimation');
       

   };

   // method stopQueue
   
   VisualArrayClass.prototype.stopAnimationQueue = function (){
      
      this._animationQueue.stop('sortAnimation');
      this._animationQueue.clearQueue('sortAnimation');
   }

   // method bubbleSort
   // bubble sorting 
   VisualArrayClass.prototype.bubbleSort = function(){

      var sortArr = this._data;
      var l = this._len;

      // done bubble sort and create array of animation finctions
      for(var j = l; j != 0; j--){

         for(var i = 1; i <= (j - 1); i++){
            
            this._animations.push({event: 'compareAnimationStart', id1: i - 1, id2: i});
            if(sortArr[i] < sortArr[i - 1]){
               this._animations.push({event: 'swapAnimation', id1: i - 1, id2: i});
               var tmp = sortArr[i - 1];
               sortArr[i - 1] = sortArr[i];
               sortArr[i] = tmp;               
            }
            this._animations.push({event: 'compareAnimationStop', id1: i - 1, id2: i});
         }

      }

      // create and start animation queue
      this.formAnimationQueue();

   };




   //generate array of random numbers
   function generateArray(n){

      var arr = [];

      for(var i = 0; i < n; i++){
         arr[i] = Math.floor(Math.random() * (MAX_RAND_NUMBER + 1));
      }
      return arr;       
   }
   
   //visual representation for generadted(original) array
   function createVisualization(arr){
      
      var svg = d3.select('#svgContainer')
         .append('svg')
         .attr('width', SVG_WIDTH)
         .attr('height', SVG_HEIGHT);   

      var originalArrayGroup = svg.append('g')
         .attr('id', ORIGINAL)            
         .attr('transform', 'translate(0 , 0)');

      // add to svg n groups of elements   
      var elemetGroup = originalArrayGroup.selectAll('g')
         .data(arr)
         .enter()
         .append('g')
            .attr('transform', function(d, i){
               return 'translate(' + (circleDistance * i) + ', 0)'
            });

      // add circle to each group and set attributes      
      elemetGroup.append('circle')
         .attr('class', ORIGINAL_GROUP + 'Circle')
         .attr('cx', coordX)
         .attr('cy', coordY)
         .transition()
         .duration(500)
         .attr('r', circleR);

      // add text to each group and set attributes   
      elemetGroup.append('text')  
         .attr('class', ORIGINAL_GROUP + 'Text')
         .attr('x', coordX)
         .attr('y', coordY + TXT_Y_CORRECTION)
         .text(function(d, i){
            return d;
         }) ;  

   }

   //visual representation for sorted array
   function copyArray(){
       
      // copy original array      
      var sortedArrayGroup = d3.select('#' + ORIGINAL).clone(true);

      // change id and translate
      sortedArrayGroup.attr('id', SORTED)
         .transition()
         .duration(600)
         .attr('transform', 'translate(0, ' + (0 + GROUP_DISTANCE) +')')
         .selectAll('g')
            .attr('id', function(d, i){
               return 'g' + i;
            });

      // change style of circles and text

      sortedArrayGroup.selectAll('circle')
            .transition()
            .duration(600)
            .attr('class', STANDART_GROUP + 'Circle');

      sortedArrayGroup.selectAll('text')   
            .transition()
            .duration(600)
            .attr('class', STANDART_GROUP + 'Text');   

   }

   //clear svg
   function clearSvg(){
      d3.select("svg").remove();
      originalArray = [];
      visualArray.stopAnimationQueue();
      visualArray = {};
   }

} );