/**
 * Initial script, used with test index.html.
 * @author Ievgen Petrashchuk a.k.a Vaper de kin 2017
 */
/* eslint no-undef: off */
const Viewer3D = require('./Viewer3D');
const assets = require('./helpers/assets');
const _ = require('lodash');
const dragItems = require('./items.json');

const isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
    return p.toString() === "[object SafariRemoteNotification]";
})(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

const isFirefox = typeof InstallTrigger !== 'undefined';
const isLinux = /Linux/.test(window.navigator.platform);

/**
 * Downloads a text file
 * @param filename Filename you want
 * @param text Text contents
 */
function download(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof test !== 'undefined') {
        $.fn.touch = function (handler) {
            $(this).on('click touchend', handler);
        };

        let viewerWidth = window.innerWidth;
        let viewerHeight = window.innerHeight - $('.views').height() - $('.tabs').height() - $('.controls').height() - 30;

        let mainColor = '#b5001a';
        let secondaryColor = '#6b6b6b';
        let shuttersColor = '#ffffff';
        let flowerBoxColor = '#ffffff';

        let viewer3D = new Viewer3D(viewerWidth, viewerHeight);
        $('.viewer-3d').append(viewer3D.element);
        window.viewer3D = viewer3D;

        viewer3D.openContextMenuOnAdding = false;
        viewer3D.showLoader = true;

        window.onresize = () => {
            viewerWidth = window.innerWidth;
            viewerHeight = window.innerHeight - $('.views').height() - $('.tabs').height() - $('.controls').height() - 30;

            viewer3D.width = viewerWidth;
            viewer3D.height = viewerHeight;
        };

        function scrollHorizontally(e) {
            e = window.event || e;
            let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
            $('.controls')[0].scrollLeft -= (delta * 100);
            e.preventDefault();
        }

        $('.controls').on('mousewheel', scrollHorizontally);

        $('[data-id]').each(function () {
            let dataID = $(this).attr('data-id');
            dataID = dataID.toLowerCase().replace('lh-out', 'out').replace(/['"()]/g, '').replace(/[\s-]/g, "_");
            $(this).attr('data-id', dataID);
        });

        $('.section.windows [data-id]').each(function () {
            let dataID = $(this).attr('data-id');
            $(this).find('div').css({
                'background-image': `url("${assets.img[dataID]}")`
            });
        });

        viewer3D.addEventListener('progress', (e) => {
            // console.log((e.loaded / e.total * 100).toFixed(2) + '%');
        });

        viewer3D.addEventListener('loaded', () => {
            console.log('loaded');
        });

        viewer3D.loadResources(['lp_smartside_siding', 'metal_exterior_siding', 'horizontal_metal_siding', 't1_11_siding', 'vinyl_siding']);

        let $zoomSlider = $(".zoom-slider").slider()
            .on("slide", (event) => {
                $(".zoom-value").text(event.value.toFixed(2));
                viewer3D.zoom = event.value;
            });

        viewer3D.addEventListener('changeZoom', (event) => {
            $zoomSlider.slider('setValue', event.zoom)
            $(".zoom-value").text(event.zoom.toFixed(2));
        });

        $('.snapshot').off().click(() => {
            viewer3D.getSnapshot(1/* parseFloat($(".zoom-value").text()) */).then((image) => {
                $('.render-snapshot').html('<img src="' + image + '">');
            });
        });

        $('.tab').off().click(function () {
            let currentClass = /tab-([a-z\-\d]+)/i.exec($('.tab.active').attr('class'))[1];
            $('.tab').removeClass('active');
            $('.section').addClass('hidden');
            $(this).addClass('active');
            let sectionClass = /tab-([a-z\-\d]+)/i.exec($(this).attr('class'))[1];
            $(`.section.${sectionClass}`).removeClass('hidden');

            if (dragItems[currentClass]) {
                let resources = _.map(dragItems[currentClass], (resource) => _.keys(resource)[0].replace(/(_rh|_lh)$/, ''));
                viewer3D.unloadResources(resources);
            }

            if (dragItems[sectionClass]) {
                let resources = _.map(dragItems[sectionClass], (resource) => _.keys(resource)[0].replace(/(_rh|_lh)$/, ''));
                if (sectionClass === 'windows') {
                    resources = _.map(resources, (resource) => {
                        return {
                            type: resource,
                            canVMove: true,
                            canRotate: true
                        }
                    });
                }
                viewer3D.loadResources(resources);
            }
            if (sectionClass === 'roofs') {
                viewer3D.loadResources(["Heritage Rustic Black", "Heritage Black Walnut", "Heritage Rustic Cedar",
                    "Heritage Mountain Slate", "Premier Antique Black", "Premier Buckskin Tan", "Premier Driftwood",
                    "Premier Harvest Brown", "Premier Oakwood", "Premier Pewter Gray", "Premier Prairie Wood",
                    "Premier Sherwood Green", "Premier Weathered White", "Premier Weathered Wood"]);
            }
        });

        $('.set').touch(() => {
            viewer3D.shed.setSize($('.width').val(), $('.depth').val(), $('.height').val(), $('.style').val());
        });

        // for dimensions
        $('#eightdimension').touch(() => {
            let width = 8;
            let height = 7;
            let depth = 12;
            viewer3D.shed.setSize(width, depth, height);
        });
        $('#tendimension').touch(() => {
            let width = 10;
            let height = 7;
            let depth = 16;
            viewer3D.shed.setSize(width, depth, height);
        });
        $('#twelvedimension').touch(() => {
            let width = 12;
            let height = 7;
            let depth = 32;
            viewer3D.shed.setSize(width, depth, height);
        });

        $('.show-door').touch(function () {
            viewer3D.shed.doors.show = $(this)[0].checked;
        });

        $('.show-windows').touch(function () {
            viewer3D.shed.windows.show = $(this)[0].checked;
        });

        $('.show-environemnt').touch(function () {
            viewer3D.environment.enabled = $(this)[0].checked;
        });

        $('.open-context').touch(function () {
            viewer3D.openContextMenuOnAdding = $(this)[0].checked;
        });
        $('.disable-context').touch(function () {
            viewer3D.menuIsDisabled = $(this)[0].checked;
        });

        $('.center-items').touch(function () {
            viewer3D.shouldCenterItems = $(this)[0].checked;
        });

        $('.grass-scale-set').touch(() => {
            viewer3D.environment.grassScale = $('.grass-scale').val();
        });

        $('.grass-count-set').touch(() => {
            viewer3D.environment.grassCount = parseInt($('.grass-count').val());
        });

        $('.colors-item').touch((e) => {
            mainColor = e.currentTarget.getAttribute('color');
            secondaryColor = document.getElementById("primarykey").getAttribute("secondarycolor");
            viewer3D.shed.setColor(mainColor, secondaryColor, shuttersColor, flowerBoxColor);
            document.getElementById("primarykey").setAttribute("maincolor", mainColor);
        });

        $('.trim-colors-item').touch((e) => {
            mainColor = document.getElementById("primarykey").getAttribute("maincolor");
            secondaryColor = e.currentTarget.getAttribute('color');

            viewer3D.shed.setColor(mainColor, secondaryColor, shuttersColor, flowerBoxColor);
            document.getElementById("primarykey").setAttribute("secondarycolor", secondaryColor);
        });

        $('.trim-item').touch((e) => {
            let trimId = e.currentTarget.getAttribute('data-id');

            viewer3D.shed.setTrim(trimId);
        });

        $('.door-trim-item').touch((e) => {
            let trimId = e.currentTarget.getAttribute('data-id');

            viewer3D.shed.setDoorTrim(trimId);
        });

        $('.main-color').colorpicker({
            color: mainColor,
            format: 'hex'
        }).on('changeColor', (e) => {
            mainColor = e.color.toString('hex');
            viewer3D.shed.setColor(mainColor, secondaryColor, shuttersColor, flowerBoxColor);
        });

        $('.secondary-color').colorpicker({
            color: secondaryColor,
            format: 'hex'
        }).on('changeColor', (e) => {
            secondaryColor = e.color.toString('hex');
            viewer3D.shed.setColor(mainColor, secondaryColor, shuttersColor, flowerBoxColor);
        });

        $('.shutters-color').colorpicker({
            color: '#ffffff',
            format: 'hex'
        }).on('changeColor', (e) => {
            shuttersColor = e.color.toString('hex');
            viewer3D.shed.setColor(mainColor, secondaryColor, shuttersColor, flowerBoxColor);
        });

        $('.flowerbox-color').colorpicker({
            color: '#ffffff',
            format: 'hex'
        }).on('changeColor', (e) => {
            flowerBoxColor = e.color.toString('hex');
            viewer3D.shed.setColor(mainColor, secondaryColor, shuttersColor, flowerBoxColor);
        });

        $('.view-button').touch((e) => {
            viewer3D.perspective = e.currentTarget.getAttribute('data-type');
        });

        $('.dimensions').touch(() => {
            viewer3D.dimensions.visible = !viewer3D.dimensions.visible;
            if (viewer3D.dimensions.visible) {
                $('.dimensions')[0].innerText = 'Hide Dimensions';
            } else {
                $('.dimensions')[0].innerText = 'Show Dimensions';
            }
        });

        $('.destroy').touch(() => {
            viewer3D.destroy();
        });

        $('.roof-item').touch((e) => {
            viewer3D.shed.roof.color = {color: e.currentTarget.getAttribute('data-type'), info: "test-item-info"};
        });

        $('.siding-item').touch((e) => {
            viewer3D.shed.setSiding(e.currentTarget.getAttribute('data-type'));
        });

        $('.save').touch(() => {
            download("usc3d.json", JSON.stringify(viewer3D.save()));
        });

        $('.load').touch(() => {
            let $fileInput = $('<input>').attr({style: 'display:none;', type: 'file'}).appendTo($('body'));

            $fileInput.click();

            $fileInput.on("change", (e) => {
                let reader = new FileReader();
                reader.onload = (e) => {
                    viewer3D.load(JSON.parse(e.target.result), () => console.log('load callback'));
                };
                reader.readAsText($fileInput[0].files[0]);

                $fileInput.remove();
            });
        });

        $('.full-screen').touch(() => {
            if (viewer3D.element.requestFullScreen) {
                viewer3D.element.requestFullScreen();
            } else if (viewer3D.element.webkitRequestFullScreen) {
                viewer3D.element.webkitRequestFullScreen();
            } else if (viewer3D.element.mozRequestFullScreen) {
                viewer3D.element.mozRequestFullScreen();
            } else if (viewer3D.element.msRequestFullScreen) {
                viewer3D.element.msRequestFullScreen();
            }
        });

        $('.get-views').touch(() => {
            viewer3D.getImages().then((views) => {
                $('.render-front').html('<img src="' + views.front + '">');
                $('.render-left').html('<img src="' + views.left + '">');
                $('.render-back').html('<img src="' + views.back + '">');
                $('.render-right').html('<img src="' + views.right + '">');
                $('.render-plan').html('<img src="' + views.plan + '">');
            });
        });

        document.onfullscreenchange = document.onwebkitfullscreenchange = document.onmozfullscreenchange = document.MSFullscreenChange = document.onwebkitfullscreenchange = document.onwebkitfullscreenchange = (event) => {
            if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
                viewer3D.width = window.innerWidth;
                viewer3D.height = window.innerHeight;
            } else {
                viewer3D.width = 600;
                viewer3D.height = 400;
            }
        };

        viewer3D.addEventListener("changeView", (e) => {
        });

        viewer3D.addEventListener("change", (e) => {
            console.log("change");
        });

        const objectGroups = [
            ['steel_9_light_walk_in_door', 'short_steel_9_light_walk_in_door', 'steel_walk_in_door',
                'short_steel_9_light_walk_out_door', 'short_steel_walk_in_door'],
            ['3_shed_door', '3_shed_door_w_transom'],
            ['4_shed_door', '4_shed_door_w_transom'],
            ['double_shed_door', 'double_shed_door_w_transom'],
            ['3_steel_entry_door_with_half_glass', '3_steel_entry_door_out',
                '3_steel_entry_door_half_glass_with_grids_out', '3_steel_entry_door_with_half_glass_out',
                '3_steel_entry_door', '3_steel_entry_door_with_grid_half_glass', '3_fiberglass_door'],
            ['5x7_double_wood_door', '5x7_double_wood_arch_top_door'],
            ['6x7_double_wood_door', '6x7_double_wood_arch_top_door'],
            ['9x7_insulated_overhead_panel_door', '9x7_insulated_overhead_panel_door_without_handle'],
            ['42x72_single_wood_door_lh', '42_single_wood_door_arch_top_trim_lh'],
            ['6x7_double_wood_door', '6x7_double_wood_arch_top_door'],
            ['6x6_double_wood_door', '6x6_double_wood_door_arch_top_trim', '6x6_double_wood_door_v2', '6x6_double_wood_door_v3'],
            ['8x7_overhead_garage_door', '8x7_overhead_garage_door_with_windows'],
            ['8x8_overhead_garage_door', '8x8_overhead_garage_door_with_windows'],
            ['9x7_overhead_garage_door', '9x7_overhead_garage_door_with_windows'],
            ['9x8_overhead_garage_door', '9x8_overhead_garage_door_with_windows'],
            ['10x7_overhead_garage_door', '10x7_overhead_garage_door_with_windows'],
            ['10x8_overhead_garage_door', '10x8_overhead_garage_door_with_windows'],
            ["14x21_aluminum_single_pane_window", "14x21_aluminum_single_pane_window_s",
                "14x21_aluminum_single_pane_window_vs", "14x21_aluminum_single_pane_window_f",
                "14x21_aluminum_single_pane_window_vf", "14x21_aluminum_single_pane_window_uf",
                "14x21_aluminum_single_pane_window_sf", "14x21_aluminum_single_pane_window_svf",
                "14x21_aluminum_single_pane_window_suf", "14x21_aluminum_single_pane_window_vsf",
                "14x21_aluminum_single_pane_window_vsvf", "14x21_aluminum_single_pane_window_vsuf"],
            ["18x27_aluminum_single_pane_window", "18x27_aluminum_single_pane_window_s",
                "18x27_aluminum_single_pane_window_vs", "18x27_aluminum_single_pane_window_f",
                "18x27_aluminum_single_pane_window_vf", "18x27_aluminum_single_pane_window_uf",
                "18x27_aluminum_single_pane_window_sf", "18x27_aluminum_single_pane_window_svf",
                "18x27_aluminum_single_pane_window_suf", "18x27_aluminum_single_pane_window_vsf",
                "18x27_aluminum_single_pane_window_vsvf", "18x27_aluminum_single_pane_window_vsuf"],
            ["18x36_aluminum_single_pane_window", "18x36_aluminum_single_pane_window_s",
                "18x36_aluminum_single_pane_window_vs", "18x36_aluminum_single_pane_window_f",
                "18x36_aluminum_single_pane_window_vf", "18x36_aluminum_single_pane_window_uf",
                "18x36_aluminum_single_pane_window_sf", "18x36_aluminum_single_pane_window_svf",
                "18x36_aluminum_single_pane_window_suf", "18x36_aluminum_single_pane_window_vsf",
                "18x36_aluminum_single_pane_window_vsvf", "18x36_aluminum_single_pane_window_vsuf"],
            ["1x1_window", "1x1_window_s", "1x1_window_vs", "1x1_window_f",
                "1x1_window_vf", "1x1_window_uf", "1x1_window_sf", "1x1_window_svf",
                "1x1_window_suf", "1x1_window_vsf", "1x1_window_vsvf", "1x1_window_vsuf"],
            ["24x24_vinyl_double_pane_window_without_grids", "24x24_vinyl_double_pane_window_without_grids_s",
                "24x24_vinyl_double_pane_window_without_grids_vs", "24x24_vinyl_double_pane_window_without_grids_f",
                "24x24_vinyl_double_pane_window_without_grids_vf", "24x24_vinyl_double_pane_window_without_grids_uf",
                "24x24_vinyl_double_pane_window_without_grids_sf", "24x24_vinyl_double_pane_window_without_grids_svf",
                "24x24_vinyl_double_pane_window_without_grids_suf", "24x24_vinyl_double_pane_window_without_grids_vsf",
                "24x24_vinyl_double_pane_window_without_grids_vsvf",
                "24x24_vinyl_double_pane_window_without_grids_vsuf"],
            ["24x24_vinyl_double_pane_window_with_grids", "24x24_vinyl_double_pane_window_with_grids_s",
                "24x24_vinyl_double_pane_window_with_grids_vs", "24x24_vinyl_double_pane_window_with_grids_f",
                "24x24_vinyl_double_pane_window_with_grids_vf", "24x24_vinyl_double_pane_window_with_grids_uf",
                "24x24_vinyl_double_pane_window_with_grids_sf", "24x24_vinyl_double_pane_window_with_grids_svf",
                "24x24_vinyl_double_pane_window_with_grids_suf", "24x24_vinyl_double_pane_window_with_grids_vsf",
                "24x24_vinyl_double_pane_window_with_grids_vsvf", "24x24_vinyl_double_pane_window_with_grids_vsuf"],
            ["24x27_aluminum_single_pane_window", "24x27_aluminum_single_pane_window_s",
                "24x27_aluminum_single_pane_window_vs", "24x27_aluminum_single_pane_window_f",
                "24x27_aluminum_single_pane_window_vf", "24x27_aluminum_single_pane_window_uf",
                "24x27_aluminum_single_pane_window_sf", "24x27_aluminum_single_pane_window_svf",
                "24x27_aluminum_single_pane_window_suf", "24x27_aluminum_single_pane_window_vsf",
                "24x27_aluminum_single_pane_window_vsvf", "24x27_aluminum_single_pane_window_vsuf"],
            ["24x36_aluminum_single_pane_window", "24x36_aluminum_single_pane_window_s",
                "24x36_aluminum_single_pane_window_vs", "24x36_aluminum_single_pane_window_f",
                "24x36_aluminum_single_pane_window_vf", "24x36_aluminum_single_pane_window_uf",
                "24x36_aluminum_single_pane_window_sf", "24x36_aluminum_single_pane_window_svf",
                "24x36_aluminum_single_pane_window_suf", "24x36_aluminum_single_pane_window_vsf",
                "24x36_aluminum_single_pane_window_vsvf", "24x36_aluminum_single_pane_window_vsuf"],
            ["24x36_vinyl_double_pane_window_without_grids", "24x36_vinyl_double_pane_window_without_grids_s",
                "24x36_vinyl_double_pane_window_without_grids_vs", "24x36_vinyl_double_pane_window_without_grids_f",
                "24x36_vinyl_double_pane_window_without_grids_vf", "24x36_vinyl_double_pane_window_without_grids_uf",
                "24x36_vinyl_double_pane_window_without_grids_sf", "24x36_vinyl_double_pane_window_without_grids_svf",
                "24x36_vinyl_double_pane_window_without_grids_suf", "24x36_vinyl_double_pane_window_without_grids_vsf",
                "24x36_vinyl_double_pane_window_without_grids_vsvf",
                "24x36_vinyl_double_pane_window_without_grids_vsuf"],
            ["24x36_vinyl_double_pane_window_with_grids", "24x36_vinyl_double_pane_window_with_grids_s",
                "24x36_vinyl_double_pane_window_with_grids_vs", "24x36_vinyl_double_pane_window_with_grids_f",
                "24x36_vinyl_double_pane_window_with_grids_vf", "24x36_vinyl_double_pane_window_with_grids_uf",
                "24x36_vinyl_double_pane_window_with_grids_sf", "24x36_vinyl_double_pane_window_with_grids_svf",
                "24x36_vinyl_double_pane_window_with_grids_suf", "24x36_vinyl_double_pane_window_with_grids_vsf",
                "24x36_vinyl_double_pane_window_with_grids_vsvf", "24x36_vinyl_double_pane_window_with_grids_vsuf"],
            ["29_transom_window", "29_transom_window_s", "29_transom_window_vs", "29_transom_window_f",
                "29_transom_window_vf", "29_transom_window_uf", "29_transom_window_sf", "29_transom_window_svf",
                "29_transom_window_suf", "29_transom_window_vsf", "29_transom_window_vsvf", "29_transom_window_vsuf"],
            ["29x10_transom_window_with_grids", "29x10_transom_window_with_grids_s",
                "29x10_transom_window_with_grids_vs", "29x10_transom_window_with_grids_f",
                "29x10_transom_window_with_grids_vf", "29x10_transom_window_with_grids_uf",
                "29x10_transom_window_with_grids_sf", "29x10_transom_window_with_grids_svf",
                "29x10_transom_window_with_grids_suf", "29x10_transom_window_with_grids_vsf",
                "29x10_transom_window_with_grids_vsvf", "29x10_transom_window_with_grids_vsuf"],
            ["2x3_single_pane_window", "2x3_single_pane_window_s", "2x3_single_pane_window_vs",
                "2x3_single_pane_window_f", "2x3_single_pane_window_vf", "2x3_single_pane_window_uf",
                "2x3_single_pane_window_sf", "2x3_single_pane_window_svf", "2x3_single_pane_window_suf",
                "2x3_single_pane_window_vsf", "2x3_single_pane_window_vsvf", "2x3_single_pane_window_vsuf"],
            ["30x40_vinyl_double_pane_window_without_grids", "30x40_vinyl_double_pane_window_without_grids_s",
                "30x40_vinyl_double_pane_window_without_grids_vs", "30x40_vinyl_double_pane_window_without_grids_f",
                "30x40_vinyl_double_pane_window_without_grids_vf", "30x40_vinyl_double_pane_window_without_grids_uf",
                "30x40_vinyl_double_pane_window_without_grids_sf", "30x40_vinyl_double_pane_window_without_grids_svf",
                "30x40_vinyl_double_pane_window_without_grids_suf", "30x40_vinyl_double_pane_window_without_grids_vsf",
                "30x40_vinyl_double_pane_window_without_grids_vsvf",
                "30x40_vinyl_double_pane_window_without_grids_vsuf"],
            ["30x40_vinyl_double_pane_window_with_grids", "30x40_vinyl_double_pane_window_with_grids_s",
                "30x40_vinyl_double_pane_window_with_grids_vs", "30x40_vinyl_double_pane_window_with_grids_f",
                "30x40_vinyl_double_pane_window_with_grids_vf", "30x40_vinyl_double_pane_window_with_grids_uf",
                "30x40_vinyl_double_pane_window_with_grids_sf", "30x40_vinyl_double_pane_window_with_grids_svf",
                "30x40_vinyl_double_pane_window_with_grids_suf", "30x40_vinyl_double_pane_window_with_grids_vsf",
                "30x40_vinyl_double_pane_window_with_grids_vsvf", "30x40_vinyl_double_pane_window_with_grids_vsuf"],
            ["36x48_vinyl_double_pane_window_without_grids", "36x48_vinyl_double_pane_window_without_grids_s",
                "36x48_vinyl_double_pane_window_without_grids_vs", "36x48_vinyl_double_pane_window_without_grids_f",
                "36x48_vinyl_double_pane_window_without_grids_vf", "36x48_vinyl_double_pane_window_without_grids_uf",
                "36x48_vinyl_double_pane_window_without_grids_sf", "36x48_vinyl_double_pane_window_without_grids_svf",
                "36x48_vinyl_double_pane_window_without_grids_suf", "36x48_vinyl_double_pane_window_without_grids_vsf",
                "36x48_vinyl_double_pane_window_without_grids_vsvf",
                "36x48_vinyl_double_pane_window_without_grids_vsuf"],
            ["36x48_vinyl_double_pane_window_with_grids", "36x48_vinyl_double_pane_window_with_grids_s",
                "36x48_vinyl_double_pane_window_with_grids_vs", "36x48_vinyl_double_pane_window_with_grids_f",
                "36x48_vinyl_double_pane_window_with_grids_vf", "36x48_vinyl_double_pane_window_with_grids_uf",
                "36x48_vinyl_double_pane_window_with_grids_sf", "36x48_vinyl_double_pane_window_with_grids_svf",
                "36x48_vinyl_double_pane_window_with_grids_suf", "36x48_vinyl_double_pane_window_with_grids_vsf",
                "36x48_vinyl_double_pane_window_with_grids_vsvf", "36x48_vinyl_double_pane_window_with_grids_vsuf"],
            ["36x60_vinyl_double_pane_window_with_grids", "36x60_vinyl_double_pane_window_with_grids_s",
                "36x60_vinyl_double_pane_window_with_grids_vs", "36x60_vinyl_double_pane_window_with_grids_f",
                "36x60_vinyl_double_pane_window_with_grids_vf", "36x60_vinyl_double_pane_window_with_grids_uf",
                "36x60_vinyl_double_pane_window_with_grids_sf", "36x60_vinyl_double_pane_window_with_grids_svf",
                "36x60_vinyl_double_pane_window_with_grids_suf", "36x60_vinyl_double_pane_window_with_grids_vsf",
                "36x60_vinyl_double_pane_window_with_grids_vsvf", "36x60_vinyl_double_pane_window_with_grids_vsuf"],
            ["36x60_vinyl_double_pane_window_without_grids", "36x60_vinyl_double_pane_window_without_grids_s",
                "36x60_vinyl_double_pane_window_without_grids_vs", "36x60_vinyl_double_pane_window_without_grids_f",
                "36x60_vinyl_double_pane_window_without_grids_vf", "36x60_vinyl_double_pane_window_without_grids_uf",
                "36x60_vinyl_double_pane_window_without_grids_sf", "36x60_vinyl_double_pane_window_without_grids_svf",
                "36x60_vinyl_double_pane_window_without_grids_suf", "36x60_vinyl_double_pane_window_without_grids_vsf",
                "36x60_vinyl_double_pane_window_without_grids_vsvf",
                "36x60_vinyl_double_pane_window_without_grids_vsuf"],
            ["3x3_single_pane_window", "3x3_single_pane_window_s", "3x3_single_pane_window_vs",
                "3x3_single_pane_window_f", "3x3_single_pane_window_vf", "3x3_single_pane_window_uf",
                "3x3_single_pane_window_sf", "3x3_single_pane_window_svf", "3x3_single_pane_window_suf",
                "3x3_single_pane_window_vsf", "3x3_single_pane_window_vsvf", "3x3_single_pane_window_vsuf"],
            ["3x3_double_pane_window,", "3x3_double_pane_window,_s", "3x3_double_pane_window,_vs",
                "3x3_double_pane_window,_f", "3x3_double_pane_window,_vf", "3x3_double_pane_window,_uf",
                "3x3_double_pane_window,_sf", "3x3_double_pane_window,_svf", "3x3_double_pane_window,_suf",
                "3x3_double_pane_window,_vsf", "3x3_double_pane_window,_vsvf", "3x3_double_pane_window,_vsuf"],
            ["60_transom_window", "60_transom_window_s", "60_transom_window_vs", "60_transom_window_f",
                "60_transom_window_vf", "60_transom_window_uf", "60_transom_window_sf", "60_transom_window_svf",
                "60_transom_window_suf", "60_transom_window_vsf", "60_transom_window_vsvf", "60_transom_window_vsuf"],
            ["60x10_transom_window_with_grids", "60x10_transom_window_with_grids_s",
                "60x10_transom_window_with_grids_vs", "60x10_transom_window_with_grids_f",
                "60x10_transom_window_with_grids_vf", "60x10_transom_window_with_grids_uf",
                "60x10_transom_window_with_grids_sf", "60x10_transom_window_with_grids_svf",
                "60x10_transom_window_with_grids_suf", "60x10_transom_window_with_grids_vsf",
                "60x10_transom_window_with_grids_vsvf", "60x10_transom_window_with_grids_vsuf"],
            ["72x10_transom_window_with_grids", "72x10_transom_window_with_grids_s",
                "72x10_transom_window_with_grids_vs", "72x10_transom_window_with_grids_f",
                "72x10_transom_window_with_grids_vf", "72x10_transom_window_with_grids_uf",
                "72x10_transom_window_with_grids_sf", "72x10_transom_window_with_grids_svf",
                "72x10_transom_window_with_grids_suf", "72x10_transom_window_with_grids_vsf",
                "72x10_transom_window_with_grids_vsvf", "72x10_transom_window_with_grids_vsuf"]
        ];

        const objectColorVariation = {
            "4_dutch_shed_door": ["Default", "Burgandy", "Medium Green", "Koko Brown"],
            "3_shed_door": ["Default", "Evergreen", "Desert Sand", "Ivory", "Rustic Red"],
            "steel_9_light_walk_in_door": ["Default", "Evergreen", "Desert Sand", "Ivory", "Rustic Red"]
        };

        function randomPrice() {
            return `$${Math.round(Math.random() * 200) + 200}.00`;
        }

        viewer3D.getObjectInfo = (objectID) => {
            let group = _.find(objectGroups, (group) => _.includes(group, objectID));
            let variations = _.map(_.filter(group, (id) => id != objectID), (variationID) => {
                let nameWords = variationID.split('_');
                nameWords = _.map(nameWords, (word) => word[0].toUpperCase() + word.slice(1));

                return {
                    id: variationID,
                    name: nameWords.join(' '),
                    price: randomPrice()
                }
            });

            let colorVariations = null;
            let colorGroup = _.find(objectColorVariation, (value, key) => key === objectID);

            if (colorGroup) {
                colorVariations = _.map(colorGroup, (name) => {
                    return {
                        id: name,
                        name: name,
                        price: randomPrice()
                    }
                });
            }

            return {variations, colorVariations};
        }

        // generating html items
        _.forOwn(dragItems, (itemArray, section) => {
            _.each(itemArray, (item) => {
                let element = document.createElement('div');
                let id = _.keys(item)[0];
                element.classList.add(`item${id.indexOf('2d') === 0 ? '2d' : ''}`);
                element.setAttribute('data-id', id);
                element.draggable = true;

                if (item[id].info) {
                    element.setAttribute('data-info', item[id].info);
                }

                let image = document.createElement('div');
                image.style = `background-image:url(${assets.img[id.replace(/^2d_|_lh$|_rh$/, '')]})`;
                element.appendChild(image);

                let name = document.createElement('span');
                name.innerHTML = typeof item[id] == 'string' ? item[id] : item[id].name;
                element.appendChild(name);

                document.getElementsByClassName(`section ${section}`)[0].appendChild(element);
            });
        });
    }

    let items = document.getElementsByClassName('item');
    let items2D = document.getElementsByClassName('item2d');
    _.each([].slice.call(items).concat([].slice.call(items2D)), (element) => {
        element.addEventListener('touchstart', (e) => {
            let event = new DragEvent("dragstart", {dataTransfer: new DataTransfer()});
            window.mainDragEvent = event;
            element.dispatchEvent(event);
        });
        element.addEventListener('dragstart', (e) => {
            // TODO remove back-compatibility in the future
            let data = {
                id: e.currentTarget.getAttribute('data-id') || e.currentTarget.getAttribute('id'),
                info: e.currentTarget.getAttribute('data-info')
            };

            e.dataTransfer.setData(JSON.stringify(data), '');

            // Drag-n-drop does not work on Mac and firefox on linux
            if (!isSafari && !(isLinux && isFirefox)) {
                let crt = document.createElement('div');
                crt.style.display = "none";
                e.dataTransfer.setDragImage(crt, 0, 0);
            }
        }, false);
    });
}, false);
