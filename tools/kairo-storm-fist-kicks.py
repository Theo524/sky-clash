"""Original kick phrases for the measured Storm Fist Blender control rig.

Loaded by author-kairo-storm-fist.py. These are keyed offline choreography,
not a runtime animation layer. Distances use the captured Kairo skeleton.
"""


def make_storm_kicks():
    left_start = heads["leftFoot"].copy()
    right_start = heads["rightFoot"].copy()
    pelvis = heads["hips"]

    def pivot(degrees, rise=0):
        # Keep the ball of the supporting shoe near its original point while
        # the heel turns. Support windows exclude the changing pivot itself.
        a = math.radians(degrees)
        return left_start + offset(.115 * (1 - math.cos(a)),
                                   -.115 * math.sin(a), rise)

    def pose(t, right, hip=(0, 0, 0), yaw=0, hips_yaw=0,
             lean=0, roll=0, pivot_yaw=0, foot=(0, 0, 0),
             knee=(.65, -.10, .10), left_hand=None, right_hand=None,
             support_rise=0, left=None, left_angle=None):
        return key(t,
            left_hand if left_hand is not None else guard["left"],
            right_hand if right_hand is not None else guard["right"],
            hip=hip, yaw=yaw, hips_yaw=hips_yaw, lean=lean, roll=roll,
            feet={"left": pivot(pivot_yaw, support_rise) if left is None else left,
                  "right": right},
            foot_angles={"left": left_angle if left_angle is not None else (pivot_yaw, 0, 0),
                         "right": foot},
            knees={"left": offset(.64, .10, .02), "right": offset(*knee)},
            shoulders=(-3, 4),
            elbows={'left':offset(-.12,.27,-.30),
                    'right':offset(-.18,-.34,-.28)})

    def clip(name, duration, contact, keys, windows, air=False):
        return dict(clipId=name, durationSeconds=duration, impactSeconds=contact,
                    keys=keys, grounded=not air, air=air, kickingSide="right",
                    explicitFeet=True, supportWindows=windows)

    # A rising snap kick: low recoil, high folded knee, a quick upward whip,
    # then a complete knee re-chamber before the shoe returns to the floor.
    # The lead palm remains forward while the rear elbow draws back as a
    # counterweight; this silhouette stays recognisable beside the side kick.
    rise_chamber = pelvis + offset(.12, -.035, -.34)
    rise_contact = pelvis + offset(.89, -.035, .18)
    rising = [
        pose(0, right_start),
        pose(.09, right_start + offset(-.035, 0, .025),
             (-.025, .035, -.055), -8, -12, 2, -2, foot=(0, 10, 0)),
        pose(.22, pelvis + offset(-.035, -.07, -.37),
             (-.035, .075, -.065), -4, -5, -2, -3,
             foot=(-8, 25, -2), knee=(.55, -.06, .38),
             right_hand=guard["right"] + offset(-.065, -.035, -.015)),
        pose(.32, rise_chamber,
             (.015, .080, -.045), 4, 12, -10, -4, pivot_yaw=12,
             foot=(0, -12, 0), knee=(.75, -.035, .46),
             left_hand=guard["left"] + offset(.045, .015, .025)),
        pose(.375, pelvis + offset(.55, -.035, -.035),
             (.045, .085, -.030), 11, 20, -18, -7, pivot_yaw=16,
             foot=(0, -30, 0), knee=(.85, -.04, .30),
             right_hand=guard["right"] + offset(-.09, -.035, -.035)),
        pose(.41, rise_contact,
             (.065, .085, -.020), 14, 25, -24, -8, pivot_yaw=18,
             foot=(0, -38, 0), knee=(.85, -.045, .20),
             left_hand=guard["left"] + offset(.035, .015, .035),
             right_hand=guard["right"] + offset(-.12, -.045, -.055)),
        pose(.445, pelvis + offset(.89, -.025, .20),
             (.065, .085, -.020), 16, 26, -26, -9, pivot_yaw=18,
             foot=(0, -29, 0), knee=(.85, -.045, .18),
             right_hand=guard["right"] + offset(-.12, -.045, -.055)),
        pose(.525, pelvis + offset(.43, -.035, .035),
             (.030, .080, -.025), 8, 15, -14, -5, pivot_yaw=15,
             foot=(0, -8, 0), knee=(.82, -.035, .42)),
        pose(.605, rise_chamber + offset(-.035, 0, -.025),
             (.005, .065, -.030), 1, 3, -4, -2, pivot_yaw=8,
             foot=(0, 20, 0), knee=(.72, -.04, .42)),
        pose(.75, right_start + offset(.025, 0, .055),
             (-.010, .025, -.035), -3, -4, 1, 0,
             foot=(0, 9, 0), knee=(.65, -.08, .10)),
        pose(.82, right_start, (0, .005, -.015)),
        pose(.87, right_start),
    ]

    # Roundhouse: the rear heel first folds toward the seat, the knee opens
    # outside, then the instep whips around a broad horizontal arc. Pelvis
    # rotation leads a deliberately counter-rotated chest and forearms.
    round_chamber = pelvis + offset(.04, -.22, -.38)
    round_contact = pelvis + offset(.96, .035, .18)
    roundhouse = [
        pose(0, right_start),
        pose(.10, right_start + offset(-.04, -.025, .045),
             (-.025, .045, -.045), -12, -18, 3, -2,
             foot=(-12, 15, -8)),
        pose(.205, pelvis + offset(-.17, -.22, -.40),
             (-.025, .090, -.045), -7, 2, -4, -5, pivot_yaw=20,
             foot=(8, 32, -15), knee=(.18, -.78, .30),
             left_hand=guard["left"] + offset(.025, .035, .035),
             right_hand=guard["right"] + offset(-.04, -.08, .045)),
        pose(.29, round_chamber,
             (.010, .105, -.025), 18, 32, -10, -13, pivot_yaw=45,
             foot=(38, 30, -10), knee=(.45, -.73, .28),
             right_hand=guard["right"] + offset(-.085, -.10, .015)),
        pose(.355, pelvis + offset(.48, -.43, -.015),
             (.035, .105, -.055), 38, 54, -23, -22, pivot_yaw=62,
             foot=(50, 23, -12), knee=(.66, -.60, .16),
             left_hand=guard["left"] + offset(.025, .015, .065),
             right_hand=guard["right"] + offset(-.19, -.12, -.015)),
        pose(.41, round_contact,
             (.050, .105, -.060), 64, 72, -31, -27, pivot_yaw=72,
             foot=(62, 26, -10), knee=(.80, -.45, .12),
             left_hand=guard["left"] + offset(.005, .015, .075),
             right_hand=guard["right"] + offset(-.255, -.11, -.035)),
        pose(.455, pelvis + offset(.78, .34, .145),
             (.040, .105, -.050), 82, 80, -28, -25, pivot_yaw=76,
             foot=(92, 30, -6), knee=(.78, -.20, .18),
             left_hand=guard["left"] + offset(-.025, .015, .055),
             right_hand=guard["right"] + offset(-.205, -.08, -.025)),
        pose(.535, pelvis + offset(.26, .12, -.14),
             (.010, .095, -.055), 56, 58, -18, -17, pivot_yaw=58,
             foot=(60, 24, -8), knee=(.75, -.35, .35)),
        pose(.62, pelvis + offset(.045, -.14, -.37),
             (-.010, .070, -.025), 20, 24, -7, -7, pivot_yaw=30,
             foot=(22, 25, -4), knee=(.52, -.62, .32)),
        pose(.75, right_start + offset(-.015, -.025, .075),
             (-.010, .025, -.030), -3, -5, 1, 0, pivot_yaw=5,
             foot=(0, 10, 0), knee=(.62, -.10, .08)),
        pose(.83, right_start, (0, .005, -.010)),
        pose(.87, right_start),
    ]

    # Side kick: knee closes across the body, hip turns to profile, heel
    # drives out on one line. Unlike the roundhouse, there is no sweeping
    # shin arc or spin-through: the leg recoils back through its chamber.
    side_chamber = pelvis + offset(.035, .035, -.27)
    side_contact = pelvis + offset(.98, -.015, .095)
    sidekick = [
        pose(0, right_start),
        pose(.09, right_start + offset(-.025, 0, .035),
             (-.025, .045, -.045), -7, -13, 2, -2,
             foot=(0, 10, 0)),
        pose(.205, pelvis + offset(-.075, -.035, -.38),
             (-.030, .090, -.050), 12, 24, -7, -8, pivot_yaw=25,
             foot=(15, 10, -15), knee=(.38, .40, .60),
             left_hand=guard["left"] + offset(.035, .015, .035)),
        pose(.295, side_chamber,
             (-.005, .105, -.035), 40, 58, -16, -16, pivot_yaw=54,
             foot=(5, -38, -20), knee=(.62, .35, .45),
             right_hand=guard["right"] + offset(-.055, -.055, -.005)),
        pose(.365, pelvis + offset(.46, .015, -.085),
             (.025, .110, -.065), 58, 73, -28, -24, pivot_yaw=70,
             foot=(0, -67, -12), knee=(.83, .19, .20),
             left_hand=guard["left"] + offset(.025, .015, .075),
             right_hand=guard["right"] + offset(-.19, -.10, -.025)),
        pose(.41, side_contact,
             (.045, .110, -.065), 70, 82, -35, -27, pivot_yaw=78,
             foot=(0, -78, -8), knee=(.90, .15, .08),
             left_hand=guard["left"] + offset(.005, .015, .095),
             right_hand=guard["right"] + offset(-.25, -.10, -.035)),
        pose(.445, pelvis + offset(.99, -.015, .105),
             (.050, .110, -.065), 72, 83, -36, -27, pivot_yaw=78,
             foot=(0, -78, -8), knee=(.90, .15, .08),
             left_hand=guard["left"] + offset(.005, .015, .095),
             right_hand=guard["right"] + offset(-.25, -.10, -.035)),
        pose(.525, pelvis + offset(.44, .025, -.070),
             (.015, .100, -.060), 52, 66, -23, -18, pivot_yaw=63,
             foot=(0, -55, -10), knee=(.78, .30, .30)),
        pose(.61, side_chamber + offset(-.025, 0, -.025),
             (-.010, .080, -.035), 22, 33, -10, -7, pivot_yaw=35,
             foot=(0, -15, -12), knee=(.57, .40, .46)),
        pose(.75, right_start + offset(-.005, .015, .065),
             (-.010, .030, -.035), -3, -3, 1, 0, pivot_yaw=7,
             foot=(0, 10, -3), knee=(.60, -.06, .15)),
        pose(.83, right_start, (0, .005, -.015)),
        pose(.87, right_start),
    ]

    # Aerial crescent/turning kick: compact scissor preparation, a sweeping
    # instep contact and a fast folded recoil. The left leg never impersonates
    # floor support. The profile and arm counter-sweep differ from ground kicks.
    air_left = left_start + offset(-.10, .025, .31)
    sky_contact = pelvis + offset(.96, -.015, .16)
    skykick = [
        pose(0, right_start),
        pose(.075, pelvis + offset(-.12, -.17, -.41),
             (-.015, .015, -.020), -16, -25, 6, -4,
             foot=(-18, 25, -8), knee=(.22, -.65, .44),
             left=air_left, left_angle=(-8, 18, 2),
             left_hand=guard["left"] + offset(.055, .035, .035)),
        pose(.17, pelvis + offset(.04, -.30, -.29),
             (.005, .020, -.010), 10, 23, -9, -13,
             foot=(25, 25, -14), knee=(.50, -.65, .28),
             left=air_left + offset(-.055, .025, .08),
             left_angle=(12, 24, 5),
             right_hand=guard["right"] + offset(-.085, -.09, .025)),
        pose(.255, pelvis + offset(.49, -.37, .015),
             (.025, .015, .005), 40, 57, -23, -22,
             foot=(52, 25, -13), knee=(.76, -.49, .17),
             left=air_left + offset(-.075, .025, .10),
             left_angle=(28, 30, 9),
             left_hand=guard["left"] + offset(.015, .015, .065),
             right_hand=guard["right"] + offset(-.18, -.08, -.025)),
        pose(.30, sky_contact,
             (.035, .015, .015), 60, 78, -30, -26,
             foot=(70, 24, -8), knee=(.86, -.30, .12),
             left=air_left + offset(-.095, .025, .12),
             left_angle=(39, 35, 12),
             left_hand=guard["left"] + offset(-.005, .015, .075),
             right_hand=guard["right"] + offset(-.265, -.095, -.025)),
        pose(.34, pelvis + offset(.77, .31, .13),
             (.025, .015, .010), 79, 87, -27, -24,
             foot=(95, 30, -4), knee=(.84, -.10, .15),
             left=air_left + offset(-.085, .025, .10),
             left_angle=(43, 32, 12),
             right_hand=guard["right"] + offset(-.235, -.07, -.015)),
        pose(.42, pelvis + offset(.24, .10, -.16),
             (.005, .010, -.005), 55, 59, -17, -14,
             foot=(57, 24, -5), knee=(.70, -.35, .38),
             left=air_left + offset(-.045, .015, .07),
             left_angle=(25, 25, 7)),
        pose(.50, pelvis + offset(.005, -.10, -.37),
             (-.010, .005, -.010), 22, 24, -6, -5,
             foot=(18, 22, -3), knee=(.51, -.48, .40),
             left=air_left + offset(-.015, .005, .03),
             left_angle=(10, 18, 3)),
        pose(.58, right_start + offset(.015, 0, .08),
             (0, 0, -.005), -2, -4, 0, 0,
             foot=(0, 7, 0), left=left_start + offset(0, 0, .07),
             left_angle=(0, 5, 0)),
        pose(.63, right_start),
    ]

    return [
        clip("rising-kick", .87, .41, rising,
             {"left": [(0, .10), (.31, .48), (.80, .87)],
              "right": [(0, .075), (.81, .87)]}),
        clip("roundhouse", .87, .41, roundhouse,
             {"left": [(0, .10), (.39, .47), (.82, .87)],
              "right": [(0, .07), (.82, .87)]}),
        clip("side-kick", .87, .41, sidekick,
             {"left": [(0, .10), (.39, .47), (.82, .87)],
              "right": [(0, .07), (.82, .87)]}),
        clip("sky-kick", .63, .30, skykick,
             {"left": [], "right": []}, air=True),
    ]
