use std::ffi::c_int;
use std::mem;

use libdav1d_sys::{
    Dav1dAdaptiveBoolean, Dav1dChromaSamplePosition, Dav1dColorPrimaries, Dav1dMatrixCoefficients,
    Dav1dPixelLayout, Dav1dSequenceHeader, Dav1dTransferCharacteristics,
};

/// A custom struct with the same definition and layout of Dav1dSequenceHeader that implements PartialEq
#[derive(Debug, PartialEq)]
#[repr(C)]
pub struct DaveSequenceHeader {
    pub profile: u8,
    pub max_width: c_int,
    pub max_height: c_int,
    pub layout: Dav1dPixelLayout,
    pub pri: Dav1dColorPrimaries,
    pub trc: Dav1dTransferCharacteristics,
    pub mtrx: Dav1dMatrixCoefficients,
    pub chr: Dav1dChromaSamplePosition,
    pub hbd: u8,
    pub color_range: u8,
    pub num_operating_points: u8,
    pub operating_points: [DaveSequenceHeader_DaveSequenceHeaderOperatingPoint; 32],
    pub still_picture: u8,
    pub reduced_still_picture_header: u8,
    pub timing_info_present: u8,
    pub num_units_in_tick: u32,
    pub time_scale: u32,
    pub equal_picture_interval: u8,
    pub num_ticks_per_picture: u32,
    pub decoder_model_info_present: u8,
    pub encoder_decoder_buffer_delay_length: u8,
    pub num_units_in_decoding_tick: u32,
    pub buffer_removal_delay_length: u8,
    pub frame_presentation_delay_length: u8,
    pub display_model_info_present: u8,
    pub width_n_bits: u8,
    pub height_n_bits: u8,
    pub frame_id_numbers_present: u8,
    pub delta_frame_id_n_bits: u8,
    pub frame_id_n_bits: u8,
    pub sb128: u8,
    pub filter_intra: u8,
    pub intra_edge_filter: u8,
    pub inter_intra: u8,
    pub masked_compound: u8,
    pub warped_motion: u8,
    pub dual_filter: u8,
    pub order_hint: u8,
    pub jnt_comp: u8,
    pub ref_frame_mvs: u8,
    pub screen_content_tools: Dav1dAdaptiveBoolean,
    pub force_integer_mv: Dav1dAdaptiveBoolean,
    pub order_hint_n_bits: u8,
    pub super_res: u8,
    pub cdef: u8,
    pub restoration: u8,
    pub ss_hor: u8,
    pub ss_ver: u8,
    pub monochrome: u8,
    pub color_description_present: u8,
    pub separate_uv_delta_q: u8,
    pub film_grain_present: u8,
    pub operating_parameter_info: [DaveSequenceHeader_DaveSequenceHeaderOperatingParameterInfo; 32],
}

impl DaveSequenceHeader {
    pub fn from(seq_header: Dav1dSequenceHeader) -> Self {
        unsafe { mem::transmute::<Dav1dSequenceHeader, DaveSequenceHeader>(seq_header) }
    }
}

#[derive(Debug, PartialEq)]
#[repr(C)]
pub struct DaveSequenceHeader_DaveSequenceHeaderOperatingPoint {
    pub major_level: u8,
    pub minor_level: u8,
    pub initial_display_delay: u8,
    pub idc: u16,
    pub tier: u8,
    pub decoder_model_param_present: u8,
    pub display_model_param_present: u8,
}

#[derive(Debug, PartialEq)]
#[repr(C)]
pub struct DaveSequenceHeader_DaveSequenceHeaderOperatingParameterInfo {
    pub decoder_buffer_delay: u32,
    pub encoder_buffer_delay: u32,
    pub low_delay_mode: u8,
}
