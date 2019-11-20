const tools = require('./tools');

const floorHeight = {
    [tools.URBAN_MINI_BARN]: 0.92,
    [tools.URBAN_SHACK]: 0.92,
    [tools.URBAN_BARN]: 0.92,
    [tools.BYS_SHED]: 0.52,
    [tools.BYS_BARN]: 0.52,
    [tools.LEAN_TO]: 0.92,
    [tools.BACKYARD_LEAN_TO]: 0.7,
    [tools.URBAN_HOA]: 0.31,
    [tools.URBAN_STUDIO]: 0.92,
    [tools.DELUXE_SHED]: 0.92,
    [tools.ER_BARN]: 0.92,
    [tools.ER_A_FRAME]: 0.92,
    [tools.ER_ECON]: 0.92,
    [tools.HPB_GABLE_ROOF]: 0.92,
    [tools.HPB_BARN_ROOF]: 0.92,
    [tools.HPB_SP_A_FRAME]: 0.92,
    [tools.ECON_SHED]: 0.79,
    [tools.ECON_BARN]: 0.79,
    [tools.BARN]: 0.75,
    [tools.LOFTED_BARN]: 0.75,
    [tools.UTILITY]: 0.75,
    [tools.A_FRAME]: 0.65,
    [tools.DOUBLE_WIDE]: 0.65,
    [tools.ECO]: 0.65,
    [tools.CASTLE_MOUNTAIN]: 0.65,
    [tools.QUAKER]: 0.65,
    [tools.MINI_BARN]: 0.65,
    [tools.SINGLE_SLOPE]: 0.65,
    [tools.HI_BARN]: 0.65,
    [tools.METAL_A_FRAME_BB]: 0.9,
    [tools.WOODEN_A_FRAME_BB]: 0.9,
    [tools.BARN_BB]: 0.9,
    [tools.VERTICAL_METAL_A_FRAME_BB]: 0.9
};

const measurements = {
    floorHeight
};

module.exports = measurements;
