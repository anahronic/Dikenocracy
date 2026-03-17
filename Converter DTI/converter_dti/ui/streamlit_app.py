"""Thin Streamlit client for converter_dti service layer."""

from datetime import date

import streamlit as st

from converter_dti.domain.errors import ConversionError
from converter_dti.domain.service import (
    convert_dti_full,
    convert_gregorian_full,
    convert_hebrew_full,
    parse_hebrew_text_to_parts,
)
from converter_dti.ui.i18n import LABELS

MONTHS_HEBREW = [
    "ניסן",
    "אייר",
    "סיון",
    "תמוז",
    "אב",
    "אלול",
    "תשרי",
    "חשון",
    "כסלו",
    "טבת",
    "שבט",
    "אדר",
    "אדר ב",
]


def _show_full(result: dict) -> None:
    st.write("Gregorian:", result["gregorian"])
    st.write("JDN:", result["jdn"])
    st.write("DTI:", result["dti"])
    st.write("Hebrew:", result["hebrew"])


def main() -> None:
    """Run Streamlit UI."""
    st.set_page_config(page_title="Converter DTI", layout="wide")

    lang = st.sidebar.selectbox("Language", list(LABELS.keys()), index=0)
    l = LABELS[lang]

    today = date.today()

    t1, t2, t3 = st.tabs([l["tab1"], l["tab2"], l["tab3"]])

    with t1:
        st.header(l["tab1"])
        c1, c2, c3 = st.columns(3)
        year = c1.number_input(l["year"], -5000, 5000, today.year)
        month = c2.number_input(l["month"], 1, 12, today.month)
        day = c3.number_input(l["day"], 1, 31, today.day)
        try:
            result = convert_gregorian_full(int(year), int(month), int(day))
            _show_full(result)
        except ConversionError:
            st.error(l["error"])

    with t2:
        st.header(l["tab2"])
        c1, c2 = st.columns(2)
        dy = c1.number_input("DY", -100000, 100000, 6836)
        doy = c2.number_input("DOY", 1, 360, 84)
        try:
            result = convert_dti_full(int(dy), int(doy))
            _show_full(result)
        except ConversionError:
            st.error(l["error"])

    with t3:
        st.header(l["tab3"])
        input_type = st.radio(l["input_type"], [l["numeric"], l["letter"]])
        try:
            if input_type == l["numeric"]:
                c1, c2, c3 = st.columns(3)
                hy = int(c1.number_input(l["year"], 1, 9999, 5786))
                hm = int(c2.number_input(l["month"], 1, 13, 1))
                hd = int(c3.number_input(l["day"], 1, 31, 1))
            else:
                c1, c2, c3 = st.columns(3)
                year_text = c1.text_input(l["year_letters"], "")
                month_name = c2.selectbox(l["month"], MONTHS_HEBREW)
                day_text = c3.text_input(l["day_letters"], "")
                hm = MONTHS_HEBREW.index(month_name) + 1
                hy, hm, hd = parse_hebrew_text_to_parts(year_text, hm, day_text)

            result = convert_hebrew_full(int(hy), int(hm), int(hd))
            _show_full(result)
        except ConversionError:
            st.error(l["error"])


if __name__ == "__main__":
    main()
