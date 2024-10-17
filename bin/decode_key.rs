extern crate clap;
extern crate eyre;
extern crate libdav1d_sys;

use clap::Parser;
use eyre::{Ok, Result};

use parser::parse_sequence_header;

#[derive(Parser, Debug)]
#[command(version, about, long_about=None)]
struct Args {
    data: String,
    data_2: String,
}

fn main() -> Result<()> {
    let Args { data, data_2 } = Args::parse();

    let seq_header = parse_sequence_header(&data)?;
    let seq_header_2 = parse_sequence_header(&data_2)?;

    assert_eq!(seq_header, seq_header_2);

    Ok(())
}
