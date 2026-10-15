/**
 * Schematic anatomy dataset.
 *
 * IMPORTANT: these shapes are simple, self-authored primitives used to demonstrate the
 * viewer. They are NOT anatomically accurate and are NOT derived from Z-Anatomy or any
 * third-party model. Descriptions are plain-language drafts that still need clinical review.
 * See docs/ASSET_INVENTORY.md.
 */

export type SystemId = "skeletal" | "nervous" | "cardiovascular" | "respiratory" | "digestive" | "urinary";

export const SYSTEMS: Record<SystemId, { label: string; color: string }> = {
  skeletal: { label: "Skeleton", color: "#d9d4c7" },
  nervous: { label: "Nervous system", color: "#e0b84f" },
  cardiovascular: { label: "Cardiovascular", color: "#c0392b" },
  respiratory: { label: "Respiratory", color: "#d98aa0" },
  digestive: { label: "Digestive", color: "#c27a3a" },
  urinary: { label: "Urinary", color: "#7b5ea7" },
};

/** Systems the brief asks for that this build does NOT contain yet. Shown honestly in the UI. */
export const MISSING_LAYERS = [
  "Major muscles",
  "Veins and arteries (vessel network)",
  "Peripheral nerves",
  "Reproductive anatomy",
  "Skin / detailed external surface",
];

export type Shape =
  | { kind: "sphere"; args: [number] }
  | { kind: "capsule"; args: [number, number] }
  | { kind: "cylinder"; args: [number, number, number] }
  | { kind: "torus"; args: [number, number] };

export type Structure = {
  id: string;
  name: string;
  anatomicalName?: string;
  system: SystemId;
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  shape: Shape;
  location: string;
  function: string;
  related: string[];
  beginner: string;
  note?: string;
};

export const STRUCTURES: Structure[] = [
  {
    id: "skull", name: "Skull", anatomicalName: "Cranium", system: "skeletal",
    position: [0, 1.62, 0], scale: [1, 1.1, 1.05], shape: { kind: "sphere", args: [0.2] },
    location: "Head.", function: "Protects the brain and supports the structures of the face.",
    related: ["Brain", "Spine"],
    beginner: "The skull is the bony case around your brain.",
  },
  {
    id: "spine", name: "Spine", anatomicalName: "Vertebral column", system: "skeletal",
    position: [0, 0.78, -0.07], shape: { kind: "cylinder", args: [0.04, 0.04, 1.35] },
    location: "Runs down the middle of the back, from the neck to the pelvis.",
    function: "Supports the body, allows movement and protects the spinal cord.",
    related: ["Skull", "Pelvis", "Ribcage"],
    beginner: "The spine is a stack of small bones that lets you bend and keeps you upright.",
    note: "Individual vertebrae are not modelled in this build.",
  },
  {
    id: "ribcage", name: "Ribcage", anatomicalName: "Thoracic cage", system: "skeletal",
    position: [0, 1.0, 0], scale: [1, 1.15, 0.7], shape: { kind: "torus", args: [0.26, 0.025] },
    rotation: [Math.PI / 2, 0, 0],
    location: "Chest.", function: "Protects the heart and lungs and helps with breathing movements.",
    related: ["Heart", "Lungs", "Spine"],
    beginner: "The ribs form a protective cage around the heart and lungs.",
    note: "Shown as a single ring; the real structure has 12 pairs of ribs.",
  },
  {
    id: "pelvis", name: "Pelvis", anatomicalName: "Pelvic girdle", system: "skeletal",
    position: [0, 0.05, 0], scale: [1.2, 0.9, 0.7], rotation: [Math.PI / 2, 0, 0], shape: { kind: "torus", args: [0.2, 0.05] },
    location: "Lower trunk, between the spine and the legs.",
    function: "Supports the upper body and connects the trunk to the legs.",
    related: ["Spine", "Bladder"],
    beginner: "The pelvis is the large bony ring at your hips.",
  },
  {
    id: "brain", name: "Brain", anatomicalName: "Encephalon", system: "nervous",
    position: [0, 1.64, 0], scale: [0.85, 0.8, 0.9], shape: { kind: "sphere", args: [0.17] },
    location: "Inside the skull.", function: "Coordinates thinking, senses, movement and many body functions.",
    related: ["Skull", "Spinal cord"],
    beginner: "The brain is the control centre of the body.",
  },
  {
    id: "spinal-cord", name: "Spinal cord", system: "nervous",
    position: [0, 0.8, -0.1], shape: { kind: "cylinder", args: [0.015, 0.015, 1.3] },
    location: "Inside the spine.", function: "Carries signals between the brain and the rest of the body.",
    related: ["Brain", "Spine"],
    beginner: "A bundle of nerves running inside your spine, like a cable to the brain.",
  },
  {
    id: "heart", name: "Heart", anatomicalName: "Cor", system: "cardiovascular",
    position: [0.06, 1.08, 0.06], scale: [0.9, 1.1, 0.8], shape: { kind: "sphere", args: [0.1] },
    location: "Centre of the chest, slightly to the left.", function: "Pumps blood around the body.",
    related: ["Lungs", "Ribcage"],
    beginner: "The heart is a muscular pump that keeps blood moving.",
  },
  {
    id: "lung-right", name: "Right lung", anatomicalName: "Pulmo dexter", system: "respiratory",
    position: [-0.15, 1.12, 0], scale: [0.7, 1.3, 0.8], shape: { kind: "sphere", args: [0.14] },
    location: "Right side of the chest.", function: "Brings oxygen into the blood and removes carbon dioxide.",
    related: ["Left lung", "Heart", "Ribcage"],
    beginner: "Lungs fill with air when you breathe in, passing oxygen to the blood.",
  },
  {
    id: "lung-left", name: "Left lung", anatomicalName: "Pulmo sinister", system: "respiratory",
    position: [0.2, 1.12, 0], scale: [0.7, 1.3, 0.8], shape: { kind: "sphere", args: [0.14] },
    location: "Left side of the chest.", function: "Brings oxygen into the blood and removes carbon dioxide.",
    related: ["Right lung", "Heart", "Ribcage"],
    beginner: "The left lung is slightly smaller than the right to make room for the heart.",
  },
  {
    id: "liver", name: "Liver", anatomicalName: "Hepar", system: "digestive",
    position: [-0.14, 0.7, 0.04], scale: [1.5, 0.8, 0.9], shape: { kind: "sphere", args: [0.12] },
    location: "Upper right abdomen.", function: "Processes nutrients, makes bile and helps filter the blood.",
    related: ["Stomach", "Intestines"],
    beginner: "The liver is a large organ that handles many chemical jobs for the body.",
  },
  {
    id: "stomach", name: "Stomach", anatomicalName: "Gaster", system: "digestive",
    position: [0.12, 0.72, 0.05], scale: [0.9, 1.1, 0.8], rotation: [0, 0, 0.6], shape: { kind: "capsule", args: [0.06, 0.1] },
    location: "Upper left abdomen.", function: "Mixes food with digestive juices and starts digestion.",
    related: ["Liver", "Intestines"],
    beginner: "The stomach is a stretchy bag where food is broken down.",
  },
  {
    id: "intestines", name: "Intestines", anatomicalName: "Intestinum", system: "digestive",
    position: [0, 0.35, 0.03], scale: [1, 1, 0.7], rotation: [Math.PI / 2, 0, 0], shape: { kind: "torus", args: [0.13, 0.05] },
    location: "Lower abdomen.", function: "Absorb nutrients and water and move waste along.",
    related: ["Stomach", "Liver"],
    beginner: "A long tube where most of the food you eat is absorbed.",
    note: "Shown as a ring; small and large intestine are not separated here.",
  },
  {
    id: "kidney-right", name: "Right kidney", anatomicalName: "Ren dexter", system: "urinary",
    position: [-0.1, 0.62, -0.06], scale: [0.6, 1.2, 0.6], shape: { kind: "sphere", args: [0.06] },
    location: "Back of the abdomen, right side.", function: "Filters blood and makes urine.",
    related: ["Left kidney", "Bladder"],
    beginner: "Kidneys clean the blood and remove extra water and waste.",
  },
  {
    id: "kidney-left", name: "Left kidney", anatomicalName: "Ren sinister", system: "urinary",
    position: [0.1, 0.62, -0.06], scale: [0.6, 1.2, 0.6], shape: { kind: "sphere", args: [0.06] },
    location: "Back of the abdomen, left side.", function: "Filters blood and makes urine.",
    related: ["Right kidney", "Bladder"],
    beginner: "Kidneys clean the blood and remove extra water and waste.",
  },
  {
    id: "bladder", name: "Bladder", anatomicalName: "Vesica urinaria", system: "urinary",
    position: [0, 0.1, 0.05], shape: { kind: "sphere", args: [0.07] },
    location: "Lower pelvis.", function: "Stores urine until it is passed out of the body.",
    related: ["Kidneys", "Pelvis"],
    beginner: "A muscular bag that holds urine.",
  },
];
