# 📘 StructureOS: Game Theory & Design Doc

### **1. The Core Metaphor: "Thermodynamics of the Soul"**
The simulation is not arbitrary. It is a physics engine representing a psychological reality. It treats personal growth as a thermodynamic system that requires both **Heat (Energy)** and **Containment (Engine)** to perform work.

| Visual Element | Psychological Concept | Physics Equivalent |
| :--- | :--- | :--- |
| **Particles** | Ideas, Tasks, Creative Impulses | Gas Molecules |
| **Velocity** | Motivation, "Yes" Reflex, Excitement | Kinetic Energy (Heat) |
| **The Circle** | Habits, Deadlines, Schedules, "No" Reflex | Cylinder/Piston |
| **Collisions** | Anxiety, Stress, Burnout | Pressure |
| **Low Velocity** | Boredom, Procrastination, Rust | Entropy (Cold) |

> a manual to tweak the `GAME_CONFIG` in the code.

---

### **2. The Mechanics (The Math Behind the Feeling)**

The simulation relies on two opposing forces and two failure states.

#### **Force A: Innovation (The Accelerator)**
* **Code Variable:** `innovation` (0-100)
* **Physics Effect:** Increases particle `velocity` and `jitter` (randomness).
* **Behavior:** High innovation makes particles move fast and change direction unpredictably.
* **The Trap:** High innovation without containment leads to "The Void" (particles flying off-screen). This represents starting 10 projects and finishing none.

#### **Force B: Discipline (The Brakes/Steering)**
* **Code Variable:** `discipline` (0-100)
* **Physics Effect:**
    1.  **Gravity:** Pulls particles toward the center $(0,0)$.
    2.  **Friction:** Applies a drag coefficient ($v = v \times 0.96$) to stabilize movement.
    3.  **Containment:** Shrinks the radius of the boundary circle.
* **Behavior:** High discipline forces particles into a tight, predictable orbit.
* **The Trap:** High discipline reduces velocity. If velocity drops too low, the system freezes (Stagnation).

---

### **3. The Failure States (Health Meters)**

These are the "Game Over" conditions that force the user to oscillate rather than stay static.

#### **🔴 Stress (Burnout)**
* **Trigger:** High velocity impacts against the container wall.
* **Formula:** `Stress increases when ImpactForce > Threshold`.
* **Meaning:** You are trying to do too much in too little time. Your energy exceeds your structure's capacity to hold it.
* **The Cure:** **Expand.** Lower discipline (widen the circle) or lower innovation (slow down).

#### **⚫ Stagnation (Rust)**
* **Trigger:** Low average velocity of particles.
* **Formula:** `Stagnation increases when AverageSpeed < Threshold`.
* **Meaning:** You are too safe. You have a perfect schedule but no drive. The system is dying of cold.
* **The Cure:** **Inject Chaos.** Increase innovation (add randomness) or increase discipline *gravity* (force movement).

---

### **4. Level Progression (The User Journey)**

The game uses **Progressive Disclosure** to teach the concepts one by one.

* **Level 1: The Void (Chaos)**
    * *Constraint:* Discipline is locked at 0.
    * *Lesson:* "Energy is useless without direction." The user sees particles fly away, teaching the need for a container.
* **Level 2: The Container (Order)**
    * *Unlock:* Discipline Slider.
    * *Lesson:* "Structure captures energy." The user learns to trap the particles using Gravity and Walls.
* **Level 3: The Organism (Balance)**
    * *Unlock:* Health Meters (Stress/Stagnation).
    * *Lesson:* "Static perfection is impossible." The user tries to find the 'perfect spot' (70/70) but realizes Stress accumulates. This teaches that biological systems must breathe.
* **Level 4: The Architect (Mastery)**
    * *Unlock:* Protocols (Buttons).
    * *Lesson:* "Oscillation is the key." The user learns to pulse between *Deep Work Sprint* (High Discipline) and *Creative Wander* (High Innovation) to manage the health meters.

---

### **5. Configuration Guide (`GAME_CONFIG`)**

You can tweak the feel of the simulation by editing these values in the code:

* **To make the game "Harder" (More sensitive to burnout):**
    * Lower `mechanics.stressThreshold` (e.g., from 5 to 3).
    * Increase `mechanics.damageRate`.
* **To make the game "Faster" (More energetic):**
    * Increase `physics.innovationMultiplier`.
* **To change the "feel" of Discipline:**
    * Increase `physics.gravityStrength` to make it feel like a black hole.
    * Decrease `physics.friction` to make particles more "slippery" and harder to control.

### **6. Visual Cues**
* **Background Color:** Shifts Red when Stressed, Grey when Stagnant. This is peripheral feedback, simulating how burnout/boredom "colors" our view of the world.
* **Container Line:** Breaks and becomes dashed when Stress is high, symbolizing the mental framework "cracking" under pressure.
