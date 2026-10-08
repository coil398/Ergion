import unittest

from ergion import euler_step


class EulerStepTest(unittest.TestCase):
    def test_constant_velocity(self):
        state = [2.0]
        euler_step(state, 0.0, 0.25, lambda time, state: 3.0)
        self.assertAlmostEqual(state[0], 2.75, delta=1e-12)


if __name__ == "__main__":
    unittest.main()
