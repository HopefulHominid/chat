import math
import random

def lcm(a, b):
    return abs(a * b) // math.gcd(a, b)

# store a rational number expressed in lowest form
class Rational:
    def __init__(self, a, b):
        # boolean which is True iff a and b have different signs
        # a.k.a., iff this fraction is negative
        self.neg = (a < 0) != (b < 0)

        self.num = abs(a)
        self.den = abs(b)

    def simple(self):
        gcd = math.gcd(self.num, self.den)
        return self.string(self.num // gcd, self.den // gcd)

    def string(self, num, den):
        build_list = [
            '-' if self.neg else '',
            '{:4}/{:4}'
        ]
        return ''.join(build_list).format(num, den)

    def digits(self, base=10):
        n = self.num
        d = self.den
        if n > d:
            n = n % d

        multiple = lcm(d, base)
        n *= multiple // d
        history = [n]
        place = multiple // base

        while True:
            yield n // place

            n = (n % place) * base

            if n == 0: return

            if n in history:
                yield history.index(n) - len(history)
                return
            else:
                history.append(n)

    def __str__(self):
        return self.string(self.num, self.den)


cards = [
    '\U0001f0a1',
    '\U0001f0a2',
    '\U0001f0a3',
    '\U0001f0a4',
    '\U0001f0a5',
    '\U0001f0a6',
    '\U0001f0a7',
    '\U0001f0a8',
    '\U0001f0a9',
    '\U0001f0aa',
    '\U0001f0ab',
    '\U0001f0ad',
    '\U0001f0ae',
]

def random_choice(list):
    return


def digit_to_str(digit, base):
    # special rules for bases
    if base == 6:
        return str(digit + 1)
    elif base == 2:
        return 'O' if digit else '-'
    elif base == 13:
        return f'{cards[digit]} '
    elif base == 52:
        return f'{22} '

    # general case
    if digit < 10:
        return str(digit)
    # we can express up to base 36 using the lowercase alphabet
    elif digit < 36:
        return chr(97 + (digit - 10))
    # but why not go up to base 62 with the uppercase letters?
    elif digit < 62:
        return chr(65 + (digit - 36))
    else:
        return '_'

def print_intro(base):
    print('-' * 30)
    if base == 2:
        rules = [
            '1. Point to the first character.',
            '2. Flip a coin.',
            '3. If heads, go to 4. If tails, point to next icon and go to 2.',
            '4. Game over. Win if O. Lose otherwise.'
        ]
    elif base == 6:
        rules = [
            '1. Point to the first character.',
            '2. Roll a die.',
            '3. If roll is different from character, go to 4. Otherwise, point to next character and go to 2.',
            '4. Game over. Win if you didnt bust (roll higher than character).'
        ]
    elif base == 13:
        rules = [
            '1. Point to the first character.',
            '2. Draw a random card from a single 13-card suit.',
            '3. If draw is different from character, go to 4. Otherwise, point to next character and go to 2.',
            '4. Game over. Win if you didnt bust (draw higher than character).'
        ]
    elif base == 52:
        rules = [
            '1. Point to the first character.',
            '2. Draw a random card from a 52-card deck.',
            '3. If draw is different from character, go to 4. Otherwise, point to next character and go to 2.',
            '4. Game over. Win if you didnt bust (draw higher than character).'
        ]
    else:
        rules = []
    print('\n'.join(rules))

fill_with_zero = False
length = 40
bases = [2, 6, 13, 52]
rationals = [Rational(1, x) for x in range(2, 11)]

print(lcm(7, 13))

# for base in bases:
#     print_intro(base)

#     if base == 13:
#         print()
#     for q in rationals:
#         print('{} = {} : '.format(q.simple(), q), end='')
#         printed = 0

#         digits = []
#         for digit in q.digits(base=base):
#             # by convention, this means we repeat the last abs(digit) digits
#             if digit < 0:
#                 digits = digits[:digit] + ['|'] + digits[digit:]
#                 break

#             digits += [digit_to_str(digit, base)]

#             printed += 1
#             if printed >= length:
#                 break

#         print(''.join(digits))

#         if base == 13:
#             print()

##        while printed < length and fill_with_zero:
##            print(digit_to_str((0, base))
##            printed += 1
