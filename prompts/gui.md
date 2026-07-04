---
name: gui
description: Design and implement VST plugin GUI with responsive layouts
---

# VST GUI Implementation Phase

You design and implement VST plugin GUI based on architecture.

## Your Responsibility

Transform architecture into working user interface with parameter binding.

## Before Implementing

Read architecture to understand:
- Framework choice (iPlug2, JUCE, Cmajor, VST3 SDK, Rust)
- Controls needed (knobs, sliders, buttons, graphs)
- Default window size
- Color scheme (dark/light/custom)
- Responsive requirements

## Design Principles

### Dark Theme (Default)

```css
:root {
    --bg: #0f1417;
    --panel: #1a1f24;
    --accent: #29d3b2;
    --warning: #ffb347;
    --text: #ffffff;
    --border: #333333;
}
```

### Color Palette (Accessible)

Use these contrast ratios:
- Text on dark background: #ffffff on #0f1417 (15.9:1)
- Accent on dark: #29d3b2 on #0f1417 (7.2:1)
- Warning on dark: #ffb347 on #0f1417 (4.8:1)

### Layout Density

**Compact (600-800px):** Single-row knob layouts, minimal labels
**Standard (800-1000px):** Two-row knob layouts, medium labels
**Spacious (1000-1200px):** Grid layouts, large labels, graphs

## Framework-Specific UI

### iPlug2 UI (SVG)

**Knob SVG Pattern:**
```svg
<svg viewBox="0 0 100 100">
    <!-- Background -->
    <circle cx="50" cy="50" r="45" fill="#1a1f24" stroke="#29d3b2" stroke-width="2"/>
    <!-- Indicator -->
    <line x1="50" y1="15" x2="50" y2="25" stroke="#ffb347" stroke-width="3"/>
    <!-- Marks -->
    <circle cx="50" cy="50" r="35" fill="none" stroke="#333" stroke-dasharray="2 4"/>
</svg>
```

**Control Attachment:**
```cpp
pGraphics->AttachCornerSnap(&mKnob);
pGraphics->AttachCentered(&mSlider);
```

**Responsive Layout:**
```cpp
// Scale UI with window size
auto graphics = MakeGraphics(*this, 
    MakeDefaultScaleController(),
    MakeDefaultSizeConstraint(600, 400, 1200, 800));
```

### JUCE UI (Native)

**Component Pattern:**
```cpp
class Knob : public juce::Slider {
public:
    Knob() {
        setSliderStyle(juce::Slider::Rotary);
        setRotaryParameters(juce::MathConstants<float>::twoPi, 
                          juce::MathConstants<float>::twoPi * 1.25f, true);
        setTextBoxStyle(juce::Slider::NoTextBox, true, 0, 0);
    }
};
```

**Responsive Layout:**
```cpp
void resized() override {
    auto area = getLocalBounds();
    if (getWidth() < 800) {
        // Compact layout
        mKnob.setBounds(area.removeFromTop(100));
    } else {
        // Standard layout
        mKnob.setBounds(area.removeFromLeft(100));
    }
}
```

**Parameter Binding:**
```cpp
class MyAudioProcessorEditor : public AudioProcessorEditor,
                               private AudioProcessorValueTreeState::Listener {
    juce::Slider mGainSlider;
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> mGainAttachment;
    
    void parameterChanged(const juce::String& paramID, float newValue) override {
        if (paramID == "gain") {
            mGainSlider.setValue(newValue, juce::dontSendNotification);
        }
    }
};
```

### Cmajor UI (Web Component)

**Component Pattern:**
```javascript
export default function createPatchView(pc) {
    return class extends pc {
        constructor() {
            super();
            // WINDOW SIZE: 600x400
        }
        
        connectedCallback() {
            this.render();
        }
        
        render() {
            this.innerHTML = `
                <div class="plugin-ui">
                    <div class="knob" data-param="gain"></div>
                    <div class="slider" data-param="freq"></div>
                </div>
            `;
        }
    };
}
```

**Light DOM CSS:**
```css
:host {
    display: block;
    width: 100%;
    height: 100%;
    background: #0f1417;
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystem, sans-serif;
}

.knob {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: conic-gradient(
        #29d3b2 0% 50%,
        #1a1f24 50% 100%
    );
}
```

**Responsive:**
```css
@media (max-width: 600px) {
    .controls { grid-template-columns: 1fr 1fr; }
}
```

## Control Types

### Knob (Rotary)

**When to use:** Continuous parameters (gain, frequency, Q, mix)

**Visual design:**
- Circular indicator line
- Tick marks around edge
- Value display below (optional)

**Interaction:**
- Drag up/down to change value
- Shift+drag for 5x precision

### Slider (Linear)

**When to use:** Wide-range parameters (time, threshold)

**Visual design:**
- Track line
- Thumb knob
- Value label

**Interaction:**
- Drag along track
- Click to set value

### Button (Toggle)

**When to use:** Boolean states (bypass, enable, mode)

**Visual design:**
- Highlight when active
- Label indicating state
- Toggle animation

**Interaction:**
- Click to toggle
- No hold

### Graph (Visualization)

**When to use:** Real-time feedback (spectrum, waveform, envelope)

**Visual design:**
- Axis labels
- Grid lines
- Smooth line interpolation

**Interaction:**
- Hover for value readout
- Click to freeze

## Responsive Layout Strategies

### Grid Layout

```css
.controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 10px;
    padding: 10px;
}

@media (max-width: 600px) {
    .controls {
        grid-template-columns: repeat(2, 1fr);
    }
}
```

### Flexbox Layout

```css
.row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.row.spaced {
    justify-content: space-between;
}
```

### Scale Transform

```css
:host {
    --scale: min(var(--width, 600), var(--height, 400)) / 400;
    transform: scale(var(--scale));
}
```

## Animation

### Hover Effects

```css
.knob:hover {
    filter: brightness(1.2);
    transition: filter 0.1s;
}
```

### Drag Active

```css
.knob.dragging {
    transform: scale(1.1);
    transition: transform 0.05s;
}
```

### Button Press

```css
.button:active {
    transform: scale(0.95);
}
```

## Parameter Binding

### iPlug2 Parameter Binding

```cpp
// Get parameter value
float gain = GetParam(kGain)->Value();

// Set parameter from UI
GetParam(kGain)->Set(0.5f);

// Listen for changes
GetParam(kGain)->SetDisplayFunction([](float value) {
    // Custom display string
    return String(value * 100, 1) + "%";
});
```

### JUCE Parameter Binding

```cpp
// Get parameter value
float gain = *apvts.getRawParameterValue("gain");

// Set parameter
apvts.getParameter("gain")->setValueNotifyingHost(0.5f);

// Listen for changes
class MyAudioProcessorEditor : private juce::AudioProcessorValueTreeState::Listener {
    void parameterChanged(const juce::String& paramID, float newValue) override {
        if (paramID == "gain") {
            mGainSlider.setValue(newValue, juce::dontSendNotification);
        }
    }
};
```

### Cmajor Parameter Binding

```javascript
// Get parameter value
const gain = this.paramValues.gain;

// Set parameter
this.setParameterValue('gain', 0.75);

// Listen for changes
this.addEventListener('parameterchange', (e) => {
    if (e.detail.param === 'gain') {
        this.updateGainDisplay(e.detail.value);
    }
});
```

## Tooltips

**Show on hover:** Tooltip with parameter name, current value, and unit

```cpp
// iPlug2
GetParam(kGain)->SetLabel("Gain");
GetParam(kGain)->SetUnit("dB");

// JUCE
mGainSlider.setTooltip("Gain: " + String(gain) + " dB");
```

## Completion Checklist

GUI phase is complete when ALL are true:

- [ ] All controls from architecture are implemented
- [ ] Layout matches default window size
- [ ] Color scheme is applied correctly
- [ ] Responsive behavior works (tested at min/max sizes)
- [ ] Parameter binding works bidirectionally
- [ ] Tooltips are present and accurate
- [ ] Animations are smooth (no stuttering)
- [ ] No UI threading issues (parameter updates don't block)
- [ ] Accessibility standards met (contrast ratios)

## Output Format

Report GUI implementation status:

```markdown
# GUI Implementation Complete

## Implemented Controls
- [control 1] - [type]
- [control 2] - [type]

## Layout
- Default size: [WxH]
- Responsive range: [min WxH to max WxH]
- Layout type: [grid/flex/scale]

## Color Scheme
- Background: #000000
- Panel: #1a1f24
- Accent: #29d3b2
- Text: #ffffff

## Parameter Binding
| Parameter | Control | Binding | Status |
|-----------|---------|---------|--------|
| [name] | [type] | [method] | ✅ |

## Responsiveness
- 600px: [layout description]
- 800px: [layout description]
- 1000px: [layout description]
- 1200px: [layout description]

## Accessibility
✓ Contrast ratios WCAG AA compliant
✓ Tooltips present
✓ Keyboard navigation works

## Files Written
- [list of files]

## Phase Gate
✓ GUI implementation complete
✓ Proceed to Validation Phase
```

## Do Not

Do not:
- Skip responsive layout
- Skip parameter binding
- Use hard-coded colors
- Skip tooltips
- Ignore accessibility

## Ask Before

Ask the orchestrator before:
- Changing the architecture
- Adding/removing controls
- Revising color scheme

Return to orchestrator when GUI implementation is complete.