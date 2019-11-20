# Urban Sheds 3D viewer
This project is part of Urban Sheds project. Everything related to 3D viewer is here.

## Table of Contents
   * [Urban Sheds 3D viewer](#markdown-header-urban-sheds-3d-viewer)
      * [Table of Contents](#markdown-header-table-of-contents)
      * [Installation](#markdown-header-installation)
      * [Building](#markdown-header-building)
      * [API Reference](#markdown-header-api-reference)
         * [Integrating the library](#markdown-header-integrating-the-library)
         * [Viewer3D object structure](#markdown-header-viewer3d-object-structure)
         * [Viewer3D class reference](#markdown-header-viewer3d-class-reference)
            * [Methods](#markdown-header-methods)
            * [Parameters](#markdown-header-parameters)
            * [Events](#markdown-header-events)
         * [Shed object reference](#markdown-header-shed-object-reference)
            * [Parameters](#markdown-header-parameters_1)
            * [Methods](#markdown-header-methods_1)
         * [Roof object reference](#markdown-header-roof-object-reference)
            * [Parameters](#markdown-header-parameters_2)
         * [Environment object reference](#markdown-header-environment-object-reference)
            * [Parameters](#markdown-header-parameters_3)
         * [Drag-n-drop interface](#markdown-header-drag-n-drop-interface)
            * [USC ids](#usc-ids)
            * [MSC ids](#msc-ids)
            * [Window variations](#window-variations)
            * [Gable windows](#gable-windows)
            * [2D items](#2d-items)
         * [Shed styles](#markdown-header-shed-styles)

## Installation
1. Install latest NodeJS with npm (instruction for ubuntu 16.04 and node 8):
```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. Clone git repo:
```
cd /path/to/the/project
git clone git@bitbucket.org:uscdomination/usc3d.git
```

3. Install dependencies
```
cd /path/to/the/project/usc3d
npm install
```

## Building
The grunt is used as a build system, to build the project, execute following commands:
```
cd /path/to/the/project/usc3d
node_modules/.bin/grunt
```

If you want to build debug version of the library without uglifying for debugging:
```
node_modules/.bin/grunt dev
```

If you want to build the version with the global variable, use
```
node_modules/.bin/grunt global
```

## API Reference
The 3D viewer is standalone library that can be built into a project and controlled via API.

### Integrating the library
If you use CommonJS-style (browserify/webpack) module system:
```
const Viewer3D = require('./path/to/the/Viewer3D');
```
If you are using ES6-style module system:
```
import Viewer3D from './path/to/the/Viewer3D';
```

If you don't use any kind of module system, build the library with global variable, which gies you global `window.Viewer3D` variable.

Also you should link `viewer3D.css` file in your html
```
<link rel="stylesheet" href="path/to/build/folder/css/viewer3D.css"/>
```

It also possible to define library path in global `window.Viewer3DPath`, which allows to load all assets from the same path as library location.  
(web server requires additional header `Access-Control-Allow-Origin {referer_path}`)

### Viewer3D object structure
This part just for you to imagine the structure of the Viewer3D object
```
{
  constructor(width, height),
  save(),
  load(data),
  getImages(),
  getSnapshot(zoom),
  setParameters(parameters),
  destroy(),
  loadResources(resources),
  element: DOMElement,
  width: Number,
  height: Number,
  perspective: String,
  openContextMenuOnAdding: Boolean,
  shouldCenterItems: Boolean,
  menuIsDisabled: Boolean,
  getObjectInfo: function,
  showLoader: Boolean,
  shed: {
    setSize(width, depth, height, style),
    setColor(mainColor, secondaryColor),
    width: Number,
    height: Number,
    showWindows: DEPRECATED,
    showDoors: DEPRECATED,
    doors: {
        show: Boolean
    },
    windows: {
        show: Boolean,
    },
    roof: {
      color: String
    },
    style: String
  },
  environemnt: {
    enabled: Boolean
  }
}
```

### Viewer3D class reference
First, you should initialize the 3D viewer:
```
constructor(width, height)
```
where:
 `width` - height of the 3D viewer in pixels, *default* - `window.innerWidth`  
 `height` - height of the 3D viewer in pixels, *default* - `window.innerHeight`

Example:
```
let viewer3D = new Viewer3D(800, 600);
$('.viewer-3d').append(viewer3D.element);
```

#### Methods
```
save()
```
Return object with configuration of the current shed.
The object looks as following:
```
{
  shed: {
    width: String,
    width_cm: Number,
    depth: String,
    depth_cm: Number,
    height: String,
    height_cm: Number
  },
  mainColor: String,
  secondaryColor: String,
  roof: {
    type: String,
    color: String
  },
  windows: Array,
  doors: Array,
  decks: Array,
  horseStalls: Array,
  wrapArounds: Array,
  lofts: Array,
  tack_rooms: Array,
  workbenches: Array,
  ventType: String,
  vents: Array,
  skylights: Array,
}
```
where:  
`shed.width` - width of the shed  
`shed.depth` - depth of the shed  
`shed.height` - height of the shed  
`shed.mainColor` - the main color of the shed walls  
`shed.secondaryColor` - the secondary color of shed trims and doors/windows  
`shed.width_cm`, `shed.depth_cm` and `shed.height_cm` - shed's dimensions in cm. Used in load() function internally  
`roof.type` - type of the roof, could be "metallic" or "shingle"  
`roof.color` - color of the roof, see below for possible roof colors  
`windows` - array of windows objects  
`doors` - array of doors objects  
`decks` - array of decks  
`horseStalls` - array of horse stall objects  
`wrapArounds` - array of wrap-arounds  
`lofts` - array of lofts  
`tack_rooms` - array of tack rooms  
`workbenches` - array of workbenches  
`ventType` - type of the vent, in case archtop vent is used  
`vents` - array of vents  
`skylights` - array of skylights  
  
Objects look like:
```
{
  type: String,
  info: Object|String,
  position_cm: {
    x: Number,
    z: Number
  },
  position: {
    x: String,
    z: String
  },
  rotate: Number,
  size: Number,
  length: Number,
  rails: Array
}
```
where:  
`type` - Identifier of the object. See the drag-n-drop section for all available values  
`info` - Any serializable data taken from `data-info` attribute of the drag-n-drop item
`position_cm` - position of the object in cm - used internally by load() function  
`position` - x and z coordinates from the center of the building in imperial system  
`rotate` - rotation angle along y axis in radians. Used internally by load() function  
`size` - Only for lofts and workbenches. The size of the loft/workbench in feet  
`length` - Only for workbenches. The length of the workbench in feet  
`rails` - Only for decks and wrap-around. The array of objects like {index: 0, info: String|Object} - array of rails of the current deck  

  
```
load(data)
```
Loads previously saved data object, the object returned by `save()` function  
`data` - object, returned by `save()` method

```
getImages()
```
Renders 5 images and returns the promise. Promise resolves the object with images
Example of resolved object:
```
{
    front: String,
    left: String,
    back: String,
    right: String,
    plan: String
}
```
where:  
`front`,`left`,`back`,`right` and `plan` - dataURLs of rendered images.  
  
Usage:
```
viewer3D.getImages().then((views)=> {
    $('body').append(`<img src="${views.front}">`);
    $('body').append(`<img src="${views.left}">`);
    $('body').append(`<img src="${views.back}">`);
    $('body').append(`<img src="${views.right}">`);
    $('body').append(`<img src="${views.plan}">`);
});
```

```
getSnapshot(zoom)
```

Renders the current 3D view uwing specified zoom factor and returns the promise. Promise resolves the object with clipped image as datqURL.  
`zoom` - Zooming factor. Value from 0.33 to 3.33  

Usage:
```
viewer3D.getSnapshot(1).then((image)=> {
    $('body').append(`<img src="${image}">`);
});
```

```
setParameters(parameters)
```
Sets colors, style and size in one command  
`parameters` - an object like  
```
{
    mainColor: Color,
    secondaryColor: Color,
    shuttersColor: Color,
    flowerBoxColor: Color,
    roofColor: Color,
    siding: sidingID,
    trim: trimID,
    doorTrimID: deepDoorTrimID,
    style: shedStyle,
    size: {
        width: Number,
        depth: Number,
        height: Number
    }
}
```

```
destroy()
```
Destroys the viewer object, aborting loading of assets

```
loadResources(resources)
```
Loads resources (models and textures) for array of objects. For object to be drag-n-dropped, you should call this function first.
`resources` - an array of objects. Each object5 could be an objectId as a string, 0or an object like:  
```
{
    type: String,
    canVMove: Boolean,
    canRotate: Boolean
}
```
where:  
`type` - objectId  
`canVMove` - indicates if object's context menu have "move vertically" property  
`canRotate` - indicates if object's context menu have "rotate 90" property

```
unloadResources(resources)
```
Removes resources (geometries and material shaders) for array of objects. It does not affect already dropped objects.
It dos not remove any textures, as they could be shared by different objects. It can't also remove browser inner cache,
so next loadResources(), in most cases, is done from browser's cache.  
  
  
`mainColor` - color of the walls
`secondary` - color  of the trims, doors and windows  
`shuttersColor` - color of the window shutters  
`flowerBoxColor` - color  of the flower boxes  
`roofColor` - color of the roof as predefined string  
`siding` - siding id as predefined string  
`trim` - trim id as predefined string  
`doorTrimID` - deep door trim id as predefined string  
`style` - shed style as predefined string  
`size` - width, depth and wall height of the shed  
If you don't specify any of these parameters the old values are used  

Usage:
```
viewer3D.setParameters({
    {
        mainColor: '#fff000',
        secondaryColor: '#fff000',
        shuttersColor: '#fff000',
        flowerBoxColor: '#fff000',
        roofColor: 'Ivory',
        siding: 't1_11_siding',
        trim: 'metal_trim',
        doorTrimID: 'default_trim',
        style: 'A Frame',
        size: {
            width: 10,
            depth: 12,
            height: 6.675
        }
}
});
```

#### Parameters
`element` - DOM element of the 3D viewer that can be built into the html page  
`width` - width of the 3D viewer element, Change this value, when you want to resize 3D viewer  
`height` - height of the 3D viewer element, Change this value, when you want to resize 3D viewer  
`perspective` - Set it to change camera perspective. Possible values are - `front`,`left`,`back`,`right`,`top`
`shed` - shed object to configure shed parameters. See below.  
`openContextMenuOnAdding` - Boolean value. If set to true, each droped object would show context menu  
`shouldCenterItems` - Boolean value. If set to true, each dragged object would be centered on the closest free wall area  
`menuIsDisabled` - if set to true, the menu is not shown on object click. @default - false  
`getObjectInfo` - Should be assigned to a function. Viewer calls this function on every drop of the object
`showLoader` - If set tp true, shows viewer's own loader. @default - false  
  
You should assign it to the function with `objectID` as parameter and it should return info about an item, like:
```
{
    variations: [{
        id: String,
        info: Object,
        name: String,
        price: String
    }]
}
```
where:  
`variations` - array of objects that define different variations of the current object  
`id` - object ID of the varition
`name` - the nme of the object - used in popup  
`price` - the price of the object. For example - `$25.00`  
`info` - the info object, normally passed as `data-info` attribute of the element.
It will be returned by `save()` function. If the string value can be parsed to an object, `save()` returns an object.  
  
Example:
```
let viewer3D = new Viewer3D(800, 600);
$('.viewer-3d').append(viewer3D.element);

//...
//onResize event handler:
viewer3D.width = newWidth;
viewer3D.height = newHeight;
//...

//...
//perspective button handler:
viewer3D.perspective = "left";

viewer3D.getObjectInfo = (objectID, info) => {
    //return same objectInfo for all ids
    return {
        variations: [
            id: 'another_door',
            name: 'Another door'
            info: 'All objects are the same',
            price: '$192.94'
        ]
    }
}
```

#### Events
`changeView` - called  when camera changes between 3D and Plan views, has `view` parameter that could be `2d` or `3d`

Example:
```
let viewer3D = new Viewer3D(800, 600);
$('.viewer-3d').append(viewer3D.element);

viewer3D.addEventListener("changeView", (e)=> {
    console.log(e.view);
});
```

`change` - called on every user action like setting the colors, adding/moving/removing doors and windows, etc.

Example:
```
let viewer3D = new Viewer3D(800, 600);
$('.viewer-3d').append(viewer3D.element);

viewer3D.addEventListener("change", (e)=> {
    console.log(viewer3D.save());
});
```

`ready` - Called, when shed is generated

Example:
```
let viewer3D = new Viewer3D(800, 600);
$('.viewer-3d').append(viewer3D.element);

viewer3D.addEventListener("ready", (e)=> {
    console.log("Shed is ready");
});
```

`progress` - Called each time progress updates on initial load.  
Progress event properties:  
`loaded` - number of elements loaded  
`total` - total number of elements  
  
Example:  
```
let viewer3D = new Viewer3D(600, 400);
$('.viewer-3d').append(viewer3D.element);

viewer3D.addEventListener('progress', (e)=> {
    console.log((e.loaded / e.total * 100).toFixed(2) + '%');
});
```

`changeZoom` - called  when camera zooms in or zooms out, has `zoom` parameter that shows zooming factor (between 0.33 and 3.33)

Example:
```
let viewer3D = new Viewer3D(800, 600);
$('.viewer-3d').append(viewer3D.element);

viewer3D.addEventListener("changeZoom", (e)=> {
    console.log(e.zoom);
});
```

### Shed object reference
Shed object is used as parameter of the Viewer3D object. Access it to change the shed parameters like shed width x depth x height, roof type, colors, etc.

#### Parameters
`width` - Shed width, default - `8`  
`depth` - Shed depth, default - `8`  
`showDoors` - DEPRECATED. Use `doors.show`. Defines if you want to show door objects or not, default - `true`  
`showWindows` - DEPRECATED. Use `windows.show`. Defines if you want to show window objects or not, default - `true`
`roof` - Roof object to define roof parameters. See below.  
`environment` - Environment object to control environment. See below  
`style` - (read only) Style of the shed, for example "Urban Barn", "Urban Shack", "Urban Lean-to", "Econ Shed"
(full list of [Shed styles](#markdown-header-shed-styles))
  
#### Methods
```
setSize(width, depth, height, style)
```
Sets the size of the shed in feet, where:  
`width` - Shed width, default - `8`  
`depth` - Shed depth, default - `8`  
`height` - Shed wall height, default - `6.854`  
`style` - Style of the shed. You can see the list os shed styles in [Shed styles](#markdown-header-shed-styles) section

```
setColor: (mainColor, secondaryColor, shuttersColor, flowerBoxColor)
```
Sets the colors of the shed, where  
`mainColor` - The string value of the color of the walls. Example - "#fff000","red","rgba(255,0,255,0.75)"  
`secondaryColor` - The string value of the color of the wall trims. Example - "#fff000","red","rgba(255,0,255,0.75)"  
`shuttersColor` - The string value of the color of the shutters. Example - "#fff000","red","rgba(255,0,255,0.75)"  
`flowerBoxColor` - The string value of the color of the flower boxes. Example - "#fff000","red","rgba(255,0,255,0.75)"  
 
```
setSiding: (sidingId)
```
Sets the siding of the shed, where  
`sidingId` - The string value of the siding id of the Shed.
   
Example:
```
let viewer3D = new Viewer3D(800, 600);
$('.viewer-3d').append(viewer3D.element);

//...
//In shed size button handler
viewer3D.shed.setSize(shedWidth, shedDepth);
//...

//...
viewer3D.shed.showDoors = false;
//...

//...
//In siding selection handler:
viewer3D.shed.setSiding("metal_exterior_siding");
//...

//...
//In color selection handler:
viewer3D.shed.setColor(userSelectedMainColor,userSelectedSecondaryColor);
/...
```

### Roof object reference
Controls roof color and type.

#### Parameters
`color` - String value, that represent the roof color and type.  
  
There are few values available for the USC roof:

| Shingle roofs
| ----------------------
| Heritage Rustic Black   
| Heritage Black Walnut   
| Heritage Rustic Cedar   
| Heritage Mountain Slate 
| Premier Antique Black   
| Premier Buckskin Tan    
| Premier Driftwood       
| Premier Harvest Brown   
| Premier Oakwood         
| Premier Pewter Gray     
| Premier Prairie Wood    
| Premier Sherwood Green  
| Premier Weathered White 
| Premier Weathered Wood  

| Metallic roofs
| ----------------------
| Vintage White           
| Rustic Red              
| Gray                    
| Desert Sand             
| Coal Black              
| White                   
| Light Stone             
| Beige                   
| Ivory                   
| Medium Brown            
| Dark Brown              
| Burgandy                
| All Steel Red           
| High Gloss Red          
| Bright Red              
| Copper Penny            
| Weathered Copper        
| Forest Green            
| Medium Green            
| Dark Blue               
| All Steel Blue          
| Dark Grey               
| Light Grey              
| Black                   
| ABC Light Stone         
| ABC Burnished Slate     
| ABC Ivy Green           
| ABC Saddle Tan          
| ABC Charcoal Gray       

Example:  
```
let viewer3D = new Viewer3D(800, 600);
$('.viewer-3d').append(viewer3D.element);

//...
viewer3D.shed.roof.color = "Heritage Rustic Cedar";
```

### Environment object reference
Controls the environment, like grass and background panorama.

#### Parameters
`enabled` - Boolean value, show/hide the environment

### Drag-n-drop interface
To implement drag-n-drop items, you should create DOM element with `class="item"` `draggable="true"`, specified `id` and `data-info`.
`id` is used to identify the item, see the table below.  
"data-id" is DEPRECATED. Use "id" property instead.  
"data-info" - any serializable data.
  
Each door has it's orientation and can be left-handed (_lh) and right-handed (_rh). It's defined by the door ID. Just add _rh or _lh at the end of id string.
Example: `3_shed_door_rh`, `double_shed_door_lh`, etc.

*WARNING: Using ids for doors without _lh or _rh is DEPRECATED*

*Please note: When page loaded, all element should already be there. It's important for Viewer3D handle drag-n-drop properly*  
Example:
```
<script>
    let viewer3D = new Viewer3D(800, 600);
    $('.viewer-3d').append(viewer3D.element);
</script>
...
<body>
    <div style="background-image:url(img/DoorItem.png)" data-id="3_shed_door_lh" class="item" draggable="true"></div>
    <div style="background-image:url(img/WindowItem.png)" data-id="3'x3' single pane window" class="item" draggable="true"></div>
</body>
```
*Please note: If you use img-type elements, user will see drag image, following the cursor.
For div elements drag image is removed. It's recommended to use divs with background instead of img elements*

List of possible ids
```
3_shed_door
3_shed_door_w_transom
4_single_wood_door
4_dutch_shed_door
4_shed_door
4_shed_door_w_transom
6x7_roll_up_door
8x8_roll_up_door
9x7_roll_up_door
15_light_french_doors
double_dutch_shed_door
double_shed_door
double_shed_door_w_transom
econ_door
72x72_rmp_door
steel_9_light_walk_in_door
short_steel_9_light_walk_in_door
steel_french_doors
steel_walk_in_door
3x6_short_steel_walk_in_door_out
short_steel_walk_in_door
3_steel_entry_door_with_half_glass
3_steel_entry_door_out
3_steel_entry_door_half_glass_with_grids_out
3_steel_entry_door_with_half_glass_out
3_steel_entry_door
3_steel_entry_door_with_grid_half_glass
3_fiberglass_door
6_steel_entry_double_door_half_glass
6_double_fiberglass_door
5x6_double_wood_door
5x7_double_wood_door
5x7_double_wood_arch_top_door
5x7_roll_up_door
6x6_double_wood_door
6x6_double_wood_door_v2
6x6_double_wood_door_v3
6x6_roll_up_door
6x7_double_wood_door
6x7_double_wood_arch_top_door
7x6_double_wood_door
7x7_double_wood_door
7x7_roll_up_door
8x6_double_wood_door
8x7_double_wood_door
8x7_overhead_garage_door
8x7_roll_up_door
8x8_overhead_garage_door
9x6_double_wood_door
9x7_double_wood_door
9x7_overhead_garage_door
9x7_overhead_panel_door_with_windows
9x7_insulated_overhead_panel_door
9x7_insulated_overhead_panel_door_without_handle
9x8_overhead_garage_door
9x8_roll_up_door
10x7_overhead_garage_door
10x8_overhead_garage_door
10x8_roll_up_door
36x72_single_wood_door
42x72_single_wood_door
72x78_double_wood_door
72x78_double_shed_door_w_transom
42_single_wood_door_arch_top_trim
72x78_double_smartside_door
5x6_double_wood_door_arch_top_trim
6x6_double_wood_door_arch_top_trim
8x7_overhead_garage_door_with_windows
8x8_overhead_garage_door_with_windows
9x7_overhead_garage_door_with_windows
9x8_overhead_garage_door_with_windows
10x7_overhead_garage_door_with_windows
10x8_overhead_garage_door_with_windows
4x6_transom_trim_shed_door
6x6_transom_trim_shed_door
36_36_window_screened
3_0_6_8_9_light_steel_door
3_0_6_8_steel_door
4x6_transom_trim_shed_door_w_transom
6x6_transom_trim_shed_door_w_transom
4x6_transom_trim_door_with_uprights
6x6_transom_trim_door_with_uprights
6_0x6_0_double_sd_nt
6_0x6_8_double_sd_nt
1x1_window
2x3_single_pane_window
3x3_single_pane_window
3x3_double_pane_window
3x3_serving_window_horizontal_slide
29_transom_window
60_transom_window
14x21_aluminum_single_pane_window
18x27_aluminum_single_pane_window
18x36_aluminum_single_pane_window
23x10_transom_window_with_grids
24x24_vinyl_double_pane_window_without_grids
24x24_vinyl_double_pane_window_with_grids
24x27_aluminum_single_pane_window
24x36_aluminum_single_pane_window
24x36_vinyl_double_pane_window_without_grids
24x36_vinyl_double_pane_window_with_grids
29x10_transom_window_with_grids
30x40_vinyl_double_pane_window_without_grids
30x40_vinyl_double_pane_window_with_grids
36x48_vinyl_double_pane_window_without_grids
36x48_vinyl_double_pane_window_with_grids
36x60_vinyl_double_pane_window_without_grids
36x60_vinyl_double_pane_window_with_grids
60x10_transom_window_with_grids
72x10_transom_window_with_grids
24_cupola
skylight
solar_vent
8x10_archtop_vent
reverse_gable
32_dormer
6_dormer
8_dormer
10_dormer
10_dormer_3_windows
103_dormer_3x29_windows
5x7_pet_door
7x12_pet_door
10x16_pet_door
15x20_pet_door
chicken_door
3_0_6_8_steel_door
1x1_gable_window
29_transom_gable_window
60_transom_gable_window
23x10_transom_gable_window_with_grids
29x10_transom_gable_window_with_grids
60x10_transom_gable_window_with_grids
72x10_transom_gable_window_with_grids
24x27_aluminum_gable_single_pane_window
14x21_aluminum_gable_single_pane_window
18x27_aluminum_gable_single_pane_window
18x36_aluminum_gable_single_pane_window
24x24_vinyl_gable_double_pane_window_without_grids
3_2x3_window
4x4_porch_deck
6x4_porch_deck
8x4_porch_deck
10x4_porch_deck
12x4_porch_deck
8x4_deck
10x4_deck
12x4_deck
14x4_porch_deck
16x4_porch_deck
6x6_porch_deck
8x6_porch_deck
10x6_porch_deck
12x6_porch_deck
14x6_porch_deck
16x6_porch_deck
wrap_around
11_wrap_around
14_wrap_around
16_wrap_around
14x11_wrap_around
16x11_wrap_around
14x12_wrap_around
rail
livestock_opening
4x7_livestock_opening
6x7_livestock_opening
8x7_livestock_opening
livestock_opening_no_horse
4x7_livestock_opening_no_horse
6x7_livestock_opening_no_horse
8x7_livestock_opening_no_horse
12_wide_live_stock_opening_no_horse
16_wide_live_stock_opening_no_horse
20_wide_live_stock_opening_no_horse
24_wide_live_stock_opening_no_horse
28_wide_live_stock_opening_no_horse
```

#### Window variations
All shutters and flower boxes are parts of window variations now. You can see detailed list of possible variations in this doc
https://docs.google.com/spreadsheets/d/1a2Q4Xn98VEp5adrKuieYuKo_wM32CQ6V2Vw7UH-0tAg/edit#gid=1447227772
  
All those variations qre regulated by suffix. We re using this scheme:
```
[normal window id]_[shutters suffix][flowerbox suffix]
```
shutter suffixes are: `s`, `vs`  
flower box suffixes are: `f`, `uf`, `vf`  
  
Example - variations of 2x3 window:
```
2x3_single_pane_window
2x3_single_pane_window_s
2x3_single_pane_window_vs
2x3_single_pane_window_f
2x3_single_pane_window_vf
2x3_single_pane_window_uf
2x3_single_pane_window_sf
2x3_single_pane_window_svf
2x3_single_pane_window_suf
2x3_single_pane_window_vsf
2x3_single_pane_window_vsvf
2x3_single_pane_window_vsuf
```

#### Gable windows
There are special types of windows that can be put only in gable
```
1x1_gable_window
29_transom_gable_window
60_transom_gable_window
23x10_transom_gable_window_with_grids
29x10_transom_gable_window_with_grids
60x10_transom_gable_window_with_grids
72x10_transom_gable_window_with_grids
24x27_aluminum_gable_single_pane_window
14x21_aluminum_gable_single_pane_window
18x27_aluminum_gable_single_pane_window
18x36_aluminum_gable_single_pane_window
24x24_vinyl_gable_double_pane_window_without_grids
```

#### 2D items
There also a group of 2D items, used to place objects on the plan view. You should show them, when user in 2D plan view
and hide them, when user in 3D view. To keep track on 3d/2d view, use "changeView" event.
2D items are pretty similar to 3D items and have same requirements for DOM elements.
Example:
```
<script>
    let viewer3D = new Viewer3D(800, 600);
    $('.viewer-3d').append(viewer3D.element);
</script>
...
<body>
    <div data-id="2d-lawn-mower" class="item2d" draggable="true">
        <div style="background-image:url(img/LawnMowerItem.png)"></div>
        <span>Lawn Mower</span>
    </div>
</body>
```

List of possible 2D data-ids:

Name                        | Value
--------------------------- | --------------------
Loft                        | loft
ATV                         | 2d_atv
Bed                         | 2d_bed
Bike                        | 2d_bike
Computer table              | 2d_computer_table
Croquet                     | 2d_croquet
KF-04                       | 2d_kf_04
Lawn Mower                  | 2d_lawn-mower
Lazyboy                     | 2d_lazy-boy
Office Desk                 | 2d_office_desk
Ping Pong table             | 2d_ping_pong
Sofa #1                     | 2d_sofa1
Sofa #2                     | 2d_sofa2
Toolbox                     | 2d_toolbox
TV                          | 2d_tv
Wagon                       | 2d_wagon
Wheel barrow                | 2d_wheel_barrow
Work bench                  | 2d_work_bench

### Shed styles
Lists of possible shed styles:

| Urban Shed Concepts
| --------------------
| Urban Barn
| Urban Shack
| Urban Lean-to
| Urban Mini Barn
| Urban Studio
| Backyard Lean-to
| Urban HOA
| Econ Shed
| Econ Barn
| ER Barn
| ER A Frame
| ER Econ
| Green House

| Montana Shed Center
| --------------------
| A Frame
| Double White
| Eco
| Caste Mountain
| Quaker
| Mini Barn
| Single Slope  
| Hi Barn

| Yoder's Portable Buildings
| --------------------
| ypb_lofted_barn
| ypb_utility
| ypb_barn

| Black Buildings
| --------------------
| Metal_A Frame_BB
| Wood_A Frame_BB
| Barn_BB
| Vertical_Metal_A Frame_BB


### Sidings
This is a group of items that can be used to apply different types of the sidings to the shed.
To use `sidings` you should call `viewer3D.shed.setSiding` method.

List of available sidings:

```
lp_smartside_siding
metal_exterior_siding
horizontal_metal_siding
t1_11_siding
```

### Door trims
This is a group of items that can be used to apply different types of the trims to the doors.
To use `trims` you should call `viewer3D.shed.setTrim` method.

List of available sidings:

```
default_trim
metal_trim
```
