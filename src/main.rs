extern crate clap;
extern crate eyre;
extern crate libdav1d_sys;

use clap::Parser;
use eyre::{eyre, Ok, Result};
use libdav1d_sys::{
    dav1d_data_create, dav1d_data_wrap, dav1d_default_settings, DAV1D_ERR, dav1d_get_picture,
    dav1d_open, dav1d_parse_sequence_header, dav1d_send_data, Dav1dAdaptiveBoolean,
    Dav1dChromaSamplePosition, Dav1dColorPrimaries, Dav1dContext, Dav1dDecodeFrameType, Dav1dLogger,
    Dav1dMatrixCoefficients, Dav1dPicAllocator, Dav1dPicture, Dav1dPixelLayout,
    Dav1dSequenceHeader,
    Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingParameterInfo, Dav1dSequenceHeader_Dav1dSequenceHeaderOperatingPoint,
    Dav1dSettings, Dav1dTransferCharacteristics,
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
    let mut settings: Dav1dSettings = unsafe { std::mem::zeroed() };
    unsafe {
        dav1d_default_settings(&mut settings);
    }

    let mut context: *mut Dav1dContext = std::ptr::null_mut();

    let result = unsafe { dav1d_open(&mut context, &settings) };

    if result != 0 {
        return Err(eyre!("Failed to open decoder"));
    }

    let Args { data } = Args::parse();

    let mut david_data = unsafe { std::mem::zeroed() };
    let data = parse_hex_string(&data);

    let create_result = unsafe { dav1d_data_create(&mut david_data, data.len()) };

    if create_result.is_null() {
        return Err(eyre!("Failed to create Dav1d data"));
    }

    unsafe { std::ptr::copy_nonoverlapping(data.as_ptr(), david_data.data as *mut u8, data.len()) }

    let send_result = unsafe { dav1d_send_data(context, &mut david_data) };

    if send_result != 0 {
        return Err(eyre!("Failed to send data to decoder"));
    }

    loop {
        let mut picture: Dav1dPicture = unsafe { std::mem::zeroed() };

        let picture_result = unsafe { dav1d_get_picture(context, &mut picture) };

        if picture_result != 0 {
            return Err(eyre!("Failed to get picture"));
        }

        if picture.seq_hdr.is_null() || picture.frame_hdr.is_null() {
            return Err(eyre!("Parsed headers are null"));
        }

        let sequence_header = unsafe { &*picture.seq_hdr };
        let frame_header = unsafe { &*picture.frame_hdr };

        println!("{:#?}", sequence_header);

        println!("\nFrame Header:");
        println!("  Frame type: {:?}", frame_header.frame_type);
        println!("  Frame width: {:?}", frame_header.width);
        println!("  Frame height: {:?}", frame_header.height);
        println!("  Frame temporal: {:?}", frame_header.temporal_id);
        println!("  Frame spatial: {:?}", frame_header.spatial_id);
        println!("  Show frame: {}", frame_header.show_frame);
        println!("  Showable frame: {}", frame_header.showable_frame);
    }

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
