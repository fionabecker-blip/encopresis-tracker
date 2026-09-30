import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import AppModal from "../../src/components/AppModal";
import { useTheme } from "../../src/theme/useTheme";
import type { Theme } from "../../src/theme/tokens";

// Animated demos for the three core exercises. Figures are built from simple
// rounded shapes and driven by looping Animated values, so no extra native
// modules are required.

export type ExerciseKey = "bear_hold" | "crab_walk" | "froggy_jumps";

const EXERCISES: Record<
  ExerciseKey,
  { title: string; cues: string[]; why: string }
> = {
  bear_hold: {
    title: "Bear hold",
    cues: [
      "Start on all fours, hands under shoulders.",
      "Lift the knees 2\u20135 cm off the floor.",
      "Back flat, tummy tight \u2014 hold 10\u201320 seconds.",
      "Keep breathing! Rest and repeat 3\u20135 times.",
    ],
    why: "Builds deep core strength kids need to push effectively during a BM.",
  },
  crab_walk: {
    title: "Crab walk",
    cues: [
      "Sit with hands behind you, feet flat.",
      "Lift the hips so the tummy faces the ceiling.",
      "Walk forwards, backwards, or sideways.",
      "Try 10\u201320 \u201csteps\u201d, rest, repeat 2\u20133 times.",
    ],
    why: "Strengthens the trunk and pelvic muscles that support toileting posture.",
  },
  froggy_jumps: {
    title: "Froggy jumps",
    cues: [
      "Deep squat, hands on the floor between the knees.",
      "Explode up like a frog, arms reaching high.",
      "Land softly back into the squat.",
      "Try 8\u201310 jumps, rest, repeat 2\u20133 times.",
    ],
    why: "Deep squats plus jumps wake up the gut and strengthen the core \u2014 and they\u2019re fun.",
  },
};

// Distinct colours per body part so the figure never reads as one blob:
// skin for head/arms/hands, brand-coloured shirt for the torso, froggy-green
// legs, dark shoes. Every part also has a thin light outline so overlapping
// pieces stay clearly separated. All of these live in `theme.illustration`.

const CANVAS_W = 260;
const CANVAS_H = 190;
const GROUND_Y = 162;

// ---------------------------------------------------------------- Bear hold
const BearHoldScene = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bob = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    bobLoop.start();
    pulseLoop.start();
    return () => {
      bobLoop.stop();
      pulseLoop.stop();
    };
  }, [bob, pulse]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, 3] });
  const gapOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });

  return (
    <View style={styles.canvas}>
      {/* Stage floor, painted first so the figure stands on it. */}
      <View style={styles.groundShadow} />
      <View style={styles.ground} />
      <Animated.View style={{ transform: [{ translateY }] }}>
        {/* thigh */}
        <View style={[styles.body, { left: 94, top: 108, width: 12, height: 32, borderRadius: 6 }]} />
        {/* shin (hovering above ground) */}
        <View style={[styles.limbFar, { left: 72, top: 132, width: 36, height: 12, borderRadius: 6 }]} />
        {/* toes on ground */}
        <View style={[styles.extremity, { left: 66, top: 148, width: 14, height: 14, borderRadius: 5 }]} />
        {/* far arm */}
        <View style={[styles.limbFar, { left: 144, top: 112, width: 12, height: 50, borderRadius: 6 }]} />
        {/* near arm */}
        <View style={[styles.body, { left: 160, top: 112, width: 12, height: 50, borderRadius: 6 }]} />
        {/* torso */}
        <View style={[styles.body, { left: 84, top: 92, width: 94, height: 30, borderRadius: 15 }]} />
        {/* head */}
        <View style={[styles.body, { left: 168, top: 74, width: 34, height: 34, borderRadius: 17 }]} />
      </Animated.View>
      {/* knee-hover highlight */}
      <Animated.View style={[styles.gapMarker, { opacity: gapOpacity }]}>
        <Text style={styles.gapText}>knees off the floor</Text>
      </Animated.View>
    </View>
  );
};

// ---------------------------------------------------------------- Crab walk
// The shape that makes a crab walk recognisable is the bent knee: thighs carry
// on the line of the tabletop torso, then the shins drop straight to flat feet,
// while the arms post straight down under the shoulders. Four identical sticks
// hanging off a horizontal body reads as an insect, not a child, so arms and
// legs are built differently on purpose.
//
// Pivot points, in canvas coordinates. Limbs are grouped and rotated about the
// joint that actually moves so they stay welded to the torso; rotating a limb
// about its own centre (the default) swings its top end away from the body.
const CRAB_HIP = [96, 112, 0];
const CRAB_SHOULDER = [166, 112, 0];

const CrabWalkScene = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const travel = useRef(new Animated.Value(0)).current;
  const step = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const travelLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(travel, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(travel, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const stepLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(step, {
          toValue: 1,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(step, {
          toValue: 0,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    travelLoop.start();
    stepLoop.start();
    return () => {
      travelLoop.stop();
      stepLoop.stop();
    };
  }, [travel, step]);

  // Travels out and back instead of looping one way. The previous version reset
  // from +55 to -55 in a zero-duration frame, so the figure appeared to teleport
  // across the stage; walking back is also what the third cue asks for.
  const translateX = travel.interpolate({ inputRange: [0, 1], outputRange: [-28, 28] });
  const bodyBob = step.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -3, 0] });
  // Diagonal gait: near arm moves with far leg, far arm with near leg. That is
  // how a real four-point crawl stays balanced, and it breaks up the marching
  // left-right-left-right that made the old figure look like it was scuttling.
  const swingA = step.interpolate({ inputRange: [0, 1], outputRange: ["-9deg", "9deg"] });
  const swingB = step.interpolate({ inputRange: [0, 1], outputRange: ["9deg", "-9deg"] });

  // A whole leg: thigh out from the hip, shin down to the floor, foot flat.
  // `far` shifts it inboard and drops it a tier in colour so the two read as
  // near and far rather than as one thick limb.
  const Leg = ({ far }: { far: boolean }) => {
    const dx = far ? 12 : 0;
    const limb = far ? styles.limbFar : styles.body;
    return (
      <>
        {/* shin first so the thigh's rounded end covers the knee joint */}
        <View style={[limb, { left: 62 + dx, top: 112, width: 12, height: 40, borderRadius: 6 }]} />
        <View style={[styles.extremity, { left: 50 + dx, top: 149, width: 24, height: 13, borderRadius: 6 }]} />
        <View style={[limb, { left: 64 + dx, top: 102, width: 40, height: 14, borderRadius: 7 }]} />
      </>
    );
  };

  // An arm: straight down from the shoulder to a flat hand, no bend. This is
  // what the child is propped on.
  const Arm = ({ far }: { far: boolean }) => {
    const dx = far ? -13 : 0;
    const limb = far ? styles.limbFar : styles.body;
    return (
      <>
        <View style={[limb, { left: 162 + dx, top: 108, width: 12, height: 46, borderRadius: 6 }]} />
        <View style={[styles.extremity, { left: 156 + dx, top: 149, width: 23, height: 13, borderRadius: 6 }]} />
      </>
    );
  };

  return (
    <View style={styles.canvas}>
      {/* Stage floor. The shadow tracks the figure horizontally but not its bob,
          so it stays glued to the ground rather than floating with the hips. */}
      <Animated.View style={[styles.groundShadow, { transform: [{ translateX }] }]} />
      <View style={styles.ground} />
      <Animated.View style={{ transform: [{ translateX }, { translateY: bodyBob }] }}>
        {/* Far limbs first, then near, then the torso on top so every shoulder
            and hip joint is tucked underneath it. */}
        <Animated.View
          style={[styles.poseLayer, { transformOrigin: CRAB_HIP, transform: [{ rotate: swingA }] }]}
        >
          <Leg far />
        </Animated.View>
        <Animated.View
          style={[styles.poseLayer, { transformOrigin: CRAB_SHOULDER, transform: [{ rotate: swingB }] }]}
        >
          <Arm far />
        </Animated.View>
        <Animated.View
          style={[styles.poseLayer, { transformOrigin: CRAB_HIP, transform: [{ rotate: swingB }] }]}
        >
          <Leg far={false} />
        </Animated.View>
        <Animated.View
          style={[styles.poseLayer, { transformOrigin: CRAB_SHOULDER, transform: [{ rotate: swingA }] }]}
        >
          <Arm far={false} />
        </Animated.View>
        {/* Neck, drawn under both so the torso covers its base and the head
            covers its top. Without it the head floats as a detached ball —
            at this scale a 4px corner overlap does not read as attached. */}
        <View style={[styles.body, { left: 164, top: 88, width: 16, height: 24, borderRadius: 8 }]} />
        {/* torso, belly up */}
        <View style={[styles.body, { left: 88, top: 98, width: 92, height: 28, borderRadius: 14 }]} />
        {/* head, tipped back the way it is when the chest is lifted */}
        <View style={[styles.body, { left: 168, top: 76, width: 32, height: 32, borderRadius: 16 }]} />
      </Animated.View>
    </View>
  );
};

// -------------------------------------------------------------- Froggy jumps
// A kid, not a blob: two clear poses (deep squat on the ground, full stretch
// with arms up in the air) that crossfade as the figure leaves the ground.
const FroggyJumpScene = () => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const jump = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(jump, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [jump]);

  // Crouch dip -> leap -> land -> tiny settle. No squash/stretch scaling.
  const translateY = jump.interpolate({
    inputRange: [0, 0.2, 0.45, 0.68, 0.82, 1],
    outputRange: [0, 6, -58, 0, 4, 0],
  });
  // Squat pose visible on the ground; stretched pose visible while airborne.
  const squatOpacity = jump.interpolate({
    inputRange: [0, 0.26, 0.34, 0.58, 0.66, 1],
    outputRange: [1, 1, 0, 0, 1, 1],
  });
  const stretchOpacity = jump.interpolate({
    inputRange: [0, 0.26, 0.34, 0.58, 0.66, 1],
    outputRange: [0, 0, 1, 1, 0, 0],
  });
  const flightOpacity = jump.interpolate({
    inputRange: [0, 0.28, 0.45, 0.62, 1],
    outputRange: [0, 0, 1, 0, 0],
  });

  return (
    <View style={styles.canvas}>
      {/* Stage floor, painted first so the figure stands on it. */}
      <View style={styles.groundShadow} />
      <View style={styles.ground} />
      <Animated.View style={{ transform: [{ translateY }] }}>
        {/* --- Pose A: deep squat, knees out wide, hands on the floor --- */}
        <Animated.View style={[styles.poseLayer, { opacity: squatOpacity }]}>
          {/* shoes flat on the ground */}
          <View style={[styles.extremity, { left: 86, top: 150, width: 26, height: 12, borderRadius: 6 }]} />
          <View style={[styles.extremity, { left: 148, top: 150, width: 26, height: 12, borderRadius: 6 }]} />
          {/* shins, vertical from knees to feet */}
          <View style={[styles.limbFar, { left: 94, top: 126, width: 12, height: 28, borderRadius: 6 }]} />
          <View style={[styles.limbFar, { left: 154, top: 126, width: 12, height: 28, borderRadius: 6 }]} />
          {/* thighs, angled out from the hips to the knees */}
          <View
            style={[
              styles.body,
              { left: 96, top: 114, width: 36, height: 13, borderRadius: 7, transform: [{ rotate: "-18deg" }] },
            ]}
          />
          <View
            style={[
              styles.body,
              { left: 128, top: 114, width: 36, height: 13, borderRadius: 7, transform: [{ rotate: "18deg" }] },
            ]}
          />
          {/* torso (shirt) */}
          <View style={[styles.body, { left: 108, top: 84, width: 44, height: 40, borderRadius: 16 }]} />
          {/* arms reaching down between the knees */}
          <View style={[styles.body, { left: 118, top: 104, width: 9, height: 46, borderRadius: 5 }]} />
          <View style={[styles.body, { left: 133, top: 104, width: 9, height: 46, borderRadius: 5 }]} />
          {/* hands on the floor */}
          <View style={[styles.extremity, { left: 115, top: 148, width: 13, height: 13, borderRadius: 7 }]} />
          <View style={[styles.extremity, { left: 132, top: 148, width: 13, height: 13, borderRadius: 7 }]} />
          {/* head */}
          <View style={[styles.body, { left: 114, top: 56, width: 32, height: 32, borderRadius: 16 }]} />
        </Animated.View>

        {/* --- Pose B: airborne, body extended, arms reaching high --- */}
        <Animated.View style={[styles.poseLayer, { opacity: stretchOpacity }]}>
          {/* legs, extended with a slight trail */}
          <View
            style={[
              styles.body,
              { left: 116, top: 104, width: 11, height: 42, borderRadius: 6, transform: [{ rotate: "6deg" }] },
            ]}
          />
          <View
            style={[
              styles.body,
              { left: 133, top: 104, width: 11, height: 42, borderRadius: 6, transform: [{ rotate: "-6deg" }] },
            ]}
          />
          {/* pointed toes */}
          <View style={[styles.extremity, { left: 110, top: 142, width: 18, height: 10, borderRadius: 5 }]} />
          <View style={[styles.extremity, { left: 134, top: 142, width: 18, height: 10, borderRadius: 5 }]} />
          {/* arms up and slightly out */}
          <View
            style={[
              styles.body,
              { left: 100, top: 34, width: 9, height: 44, borderRadius: 5, transform: [{ rotate: "-18deg" }] },
            ]}
          />
          <View
            style={[
              styles.body,
              { left: 151, top: 34, width: 9, height: 44, borderRadius: 5, transform: [{ rotate: "18deg" }] },
            ]}
          />
          {/* torso (shirt) */}
          <View style={[styles.body, { left: 112, top: 60, width: 36, height: 48, borderRadius: 16 }]} />
          {/* head */}
          <View style={[styles.body, { left: 114, top: 32, width: 32, height: 32, borderRadius: 16 }]} />
        </Animated.View>
      </Animated.View>
      {/* motion lines while airborne */}
      <Animated.View style={[styles.motionLines, { opacity: flightOpacity }]}>
        <View style={styles.motionLine} />
        <View style={[styles.motionLine, { width: 18 }]} />
        <View style={[styles.motionLine, { width: 10 }]} />
      </Animated.View>
    </View>
  );
};

const SCENES: Record<ExerciseKey, React.ComponentType> = {
  bear_hold: BearHoldScene,
  crab_walk: CrabWalkScene,
  froggy_jumps: FroggyJumpScene,
};

type Props = {
  exercise: ExerciseKey | null;
  onClose: () => void;
};

export default function ExerciseDemo({ exercise, onClose }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  if (!exercise) return null;
  const meta = EXERCISES[exercise];
  const Scene = SCENES[exercise];
  return (
    <AppModal visible title={meta.title} onClose={onClose}>
      <Scene />
      {meta.cues.map((cue, i) => (
        <View key={cue} style={styles.cueRow}>
          <View style={styles.cueBubble}>
            <Text style={styles.cueNumber}>{i + 1}</Text>
          </View>
          <Text style={styles.cueText}>{cue}</Text>
        </View>
      ))}
      <Text style={styles.why}>{meta.why}</Text>
    </AppModal>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    canvas: {
      width: CANVAS_W,
      height: CANVAS_H,
      alignSelf: "center",
      backgroundColor: t.illustration.stage,
      borderRadius: t.radii.stage,
      overflow: "hidden",
    },
    /**
     * Contact shadow. A wide, short, fully-rounded box reads as an ellipse, so
     * this avoids pulling in an SVG dependency for one squashed circle.
     */
    groundShadow: {
      position: "absolute",
      left: (CANVAS_W - 120) / 2,
      top: GROUND_Y - 7,
      width: 120,
      height: 14,
      borderRadius: 7,
      backgroundColor: t.illustration.groundShadow,
    },
    ground: {
      position: "absolute",
      left: 12,
      right: 12,
      top: GROUND_Y,
      height: 3,
      borderRadius: 2,
      backgroundColor: t.illustration.groundLine,
    },
    poseLayer: {
      position: "absolute",
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
    // Three tiers only: near shapes, far shapes, and extremities. Every shape
    // keeps a thin surface-colored outline so overlaps stay readable now that
    // most of the figure is a single teal.
    /** Torso, head, and near-side limbs. */
    body: {
      position: "absolute",
      backgroundColor: t.illustration.body,
      borderWidth: 2,
      borderColor: t.illustration.outline,
    },
    /** Limbs on the far side of the body. */
    limbFar: {
      position: "absolute",
      backgroundColor: t.illustration.limbFar,
      borderWidth: 2,
      borderColor: t.illustration.outline,
    },
    /** Hands and feet. */
    extremity: {
      position: "absolute",
      backgroundColor: t.illustration.extremity,
      borderWidth: 2,
      borderColor: t.illustration.outline,
    },
    gapMarker: {
      position: "absolute",
      left: 60,
      top: GROUND_Y + 6,
      backgroundColor: t.colors.primaryTint,
      borderRadius: t.radii.chip,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: 2,
    },
    gapText: {
      ...t.typography.caption,
      color: t.colors.primary,
    },
    motionLines: {
      position: "absolute",
      left: 108,
      top: 132,
      gap: 5,
      alignItems: "center",
    },
    motionLine: {
      width: 26,
      height: 3,
      borderRadius: 2,
      backgroundColor: t.colors.textMuted,
    },
    cueRow: {
      flexDirection: "row",
      gap: t.spacing.md,
      alignItems: "flex-start",
    },
    cueBubble: {
      width: t.sizing.cueCircle,
      height: t.sizing.cueCircle,
      borderRadius: t.sizing.cueCircle / 2,
      backgroundColor: t.colors.primaryTint,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    cueNumber: {
      ...t.typography.cueNumber,
      color: t.colors.primary,
    },
    cueText: {
      ...t.typography.body,
      flex: 1,
      color: t.colors.textSecondary,
    },
    why: {
      ...t.typography.caption,
      color: t.colors.textSecondary,
      fontStyle: "italic",
      marginTop: 2,
    },
  });
