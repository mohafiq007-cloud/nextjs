"""Synthetic money-arithmetic contract only; NOT wired to production Recipe Costing Engine."""
from decimal import Decimal, ROUND_HALF_UP
import unittest
D = Decimal

def unit_cost(pack_cost, pack_qty, used_qty, waste_pct="0"):
    cost, qty, used, waste = map(D, (pack_cost, pack_qty, used_qty, waste_pct))
    if qty <= 0 or used < 0 or cost < 0 or not D("0") <= waste < D("100"):
        raise ValueError("invalid input")
    return cost * used / qty / (D("1") - waste / D("100"))

def money(value):
    return value.quantize(D("0.01"), rounding=ROUND_HALF_UP)

def margin(cost, price):
    c, p = map(D, (cost, price))
    if p <= 0 or c < 0:
        raise ValueError("invalid price")
    return (p-c)/p*100

class MoneyContract(unittest.TestCase):
    def test_fraction(self): self.assertEqual(unit_cost("10","3","1"), D("10")/3)
    def test_fraction_rounding(self): self.assertEqual(money(unit_cost("10","3","1")), D("3.33"))
    def test_half_up(self): self.assertEqual(money(D("1.005")), D("1.01"))
    def test_float_trap(self): self.assertEqual(money(D("0.1")+D("0.2")), D("0.30"))
    def test_zero_quantity(self):
        with self.assertRaises(ValueError): unit_cost("1","0","1")
    def test_negative_cost(self):
        with self.assertRaises(ValueError): unit_cost("-1","5","1")
    def test_negative_usage(self):
        with self.assertRaises(ValueError): unit_cost("1","5","-1")
    def test_waste_100(self):
        with self.assertRaises(ValueError): unit_cost("1","5","1","100")
    def test_waste_negative(self):
        with self.assertRaises(ValueError): unit_cost("1","5","1","-1")
    def test_waste_adjustment(self): self.assertEqual(unit_cost("10","10","5","20"), D("6.25"))
    def test_margin_not_markup(self): self.assertEqual(margin("6","10"), D("40"))
    def test_zero_price(self):
        with self.assertRaises(ValueError): margin("2","0")
    def test_zero_usage(self): self.assertEqual(unit_cost("10","10","0"), D("0"))
    def test_large_numbers(self): self.assertEqual(money(unit_cost("999999.99","3","3")), D("999999.99"))
    def test_pack_conversion(self): self.assertEqual(unit_cost("24","1000","125"), D("3.000"))
    def test_margin_loss(self): self.assertEqual(margin("12","10"), D("-20"))

if __name__ == "__main__":
    unittest.main(verbosity=2)
