extern crate clap;
extern crate eyre;
extern crate libdav1d_sys;

use clap::Parser;
use eyre::{eyre, Ok, Result};
use libdav1d_sys::{
    dav1d_parse_sequence_header, Dav1dAdaptiveBoolean, Dav1dChromaSamplePosition,
    Dav1dColorPrimaries, Dav1dMatrixCoefficients, Dav1dPixelLayout, Dav1dSequenceHeader,
    Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo,
    Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint, Dav1dTransferCharacteristics,
};

#[derive(Parser, Debug)]
#[command(version, about, long_about=None)]
struct Args {
    #[arg(long)]
    data: String,
}

fn parse_hex_string(data: &str) -> Vec<u8> {
    data.split_whitespace()
        .map(|hex| u8::from_str_radix(&hex, 16).expect("Invalid hex input"))
        .collect::<Vec<u8>>()
}

fn main() -> Result<()> {
    let mut out = Dav1dSequenceHeader {
        profile: 0,
        max_width: 0,
        max_height: 0,
        layout: Dav1dPixelLayout::DAV1D_PIXEL_LAYOUT_I400,
        pri: Dav1dColorPrimaries::DAV1D_COLOR_PRI_BT709,
        trc: Dav1dTransferCharacteristics::DAV1D_TRC_BT709,
        mtrx: Dav1dMatrixCoefficients::DAV1D_MC_IDENTITY,
        chr: Dav1dChromaSamplePosition::DAV1D_CHR_UNKNOWN,
        hbd: 0,
        color_range: 0,
        num_operating_points: 0,
        operating_points: [
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint {
                major_level: 0,
                minor_level: 0,
                initial_display_delay: 0,
                idc: 0,
                tier: 0,
                decoder_model_param_present: 0,
                display_model_param_present: 0,
            },
        ],
        still_picture: 0,
        reduced_still_picture_header: 0,
        timing_info_present: 0,
        num_units_in_tick: 0,
        time_scale: 0,
        equal_picture_interval: 0,
        num_ticks_per_picture: 0,
        decoder_model_info_present: 0,
        encoder_decoder_buffer_delay_length: 0,
        num_units_in_decoding_tick: 0,
        buffer_removal_delay_length: 0,
        frame_presentation_delay_length: 0,
        display_model_info_present: 0,
        width_n_bits: 0,
        height_n_bits: 0,
        frame_id_numbers_present: 0,
        delta_frame_id_n_bits: 0,
        frame_id_n_bits: 0,
        sb128: 0,
        filter_intra: 0,
        intra_edge_filter: 0,
        inter_intra: 0,
        masked_compound: 0,
        warped_motion: 0,
        dual_filter: 0,
        order_hint: 0,
        jnt_comp: 0,
        ref_frame_mvs: 0,
        screen_content_tools: Dav1dAdaptiveBoolean::DAV1D_OFF,
        force_integer_mv: Dav1dAdaptiveBoolean::DAV1D_OFF,
        order_hint_n_bits: 0,
        super_res: 0,
        cdef: 0,
        restoration: 0,
        ss_hor: 0,
        ss_ver: 0,
        monochrome: 0,
        color_description_present: 0,
        separate_uv_delta_q: 0,
        film_grain_present: 0,
        operating_parameter_info: [
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
            Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo {
                decoder_buffer_delay: 0,
                encoder_buffer_delay: 0,
                low_delay_mode: 0,
            },
        ],
    };

    let Args { data } = Args::parse();

    let data = parse_hex_string(&data);

    let result = unsafe {
        dav1d_parse_sequence_header(
            &mut out as *mut Dav1dSequenceHeader,
            data.as_ptr(),
            data.len(),
        )
    };

    if result != 0 {
        return Err(eyre!("Received parsing error {}", result));
    }

    println!("{:#?}", out);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_hex_string() {
        let cases = vec![
            (
                "12 00 0a 1c 00 87 07",
                vec![0x12, 0x00, 0x0a, 0x1c, 0x00, 0x87, 0x07],
            ),
            (
                "15 b7 c4 1d 94 93 58 26 27 0f f0 30 ff",
                vec![
                    0x15, 0xb7, 0xc4, 0x1d, 0x94, 0x93, 0x58, 0x26, 0x27, 0x0f, 0xf0, 0x30, 0xff,
                ],
            ),
        ];

        for (input, expected) in cases {
            assert_eq!(parse_hex_string(input), expected);
        }
    }
}
