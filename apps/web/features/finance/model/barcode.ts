// GS1 General Specifications, EAN-13 encodation (https://ref.gs1.org/standards/genspecs/).
const left = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
];
const parity = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
];
const invert = (bits: string) => bits.replace(/[01]/g, (bit) => (bit === "0" ? "1" : "0"));
export function ean13Bits(value: string): string | null {
  if (
    !/^\d{13}$/.test(value) ||
    [...value].reduce((sum, n, i) => sum + Number(n) * (i % 2 ? 3 : 1), 0) % 10 !== 0
  )
    return null;
  const pattern = parity[Number(value[0])]!;
  const first = [...value.slice(1, 7)]
    .map((n, i) =>
      pattern[i] === "L" ? left[Number(n)]! : invert(left[Number(n)]!).split("").reverse().join(""),
    )
    .join("");
  const last = [...value.slice(7)].map((n) => invert(left[Number(n)]!)).join("");
  return "101" + first + "01010" + last + "101";
}
