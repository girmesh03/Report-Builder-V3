/**
 * @module utils/ethiopianDateAdapter
 *
 * AdapterDayjs subclass used by the Ethiopian date picker (§46.6). The
 * internal value stays the approved proleptic-Gregorian equivalent; only
 * the field's section display is re-mapped: v9 formats each section per
 * token (`buildSectionsFromFormat` calls `adapter.formatByString(date,
 * token)`), so the `DD`/`MM`/`YY`/`YYYY` tokens render the Ethiopian
 * date parts. Every other token (time, separators, placeholders) behaves
 * exactly like the base adapter.
 */
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { gregorianToEthiopian } from "./ethiopianDate";

/**
 * Tokens re-mapped to Ethiopian date parts (§46.6).
 * @type {readonly string[]}
 */
const ETHIOPIAN_TOKENS = Object.freeze(["DD", "MM", "YY", "YYYY"]);

export class EthiopianDateAdapter extends AdapterDayjs {
  constructor(params) {
    super(params);
    const formatByString = this.formatByString.bind(this);
    this.formatByString = (value, formatString) => {
      if (ETHIOPIAN_TOKENS.includes(formatString) && this.isValid(value)) {
        const ethiopian = gregorianToEthiopian(this.toJsDate(value));
        switch (formatString) {
          case "DD":
            return String(ethiopian.day).padStart(2, "0");
          case "MM":
            return String(ethiopian.month).padStart(2, "0");
          case "YY":
            return String(ethiopian.year % 100).padStart(2, "0");
          case "YYYY":
            return String(ethiopian.year).padStart(4, "0");
        }
      }
      return formatByString(value, formatString);
    };
  }
}