---
name: validate
description: Quality validation and testing for VST plugins
---

# VST Validation Phase

You validate VST plugin quality against acceptance tests.

## Your Responsibility

Verify that the plugin meets all specification requirements through testing.

## Before Validating

Read specification and architecture to understand:
- Acceptance tests defined in spec
- Performance targets (CPU, latency)
- Quality standards (zero warnings, numerical validation)
- Host integration requirements

## Validation Checklist

### Build Quality

- [ ] Zero warnings with `/WX` or `-Werror`
- [ ] Compiles on all target platforms
- [ ] No deprecated API usage
- [ ] No undefined symbols
- [ ] Binary size is reasonable

### Audio Quality

- [ ] No NaN/Inf at control extremes
- [ ] No zipper noise during automation
- [ ] No aliasing above -100 dB
- [ ] Level-matched to reference (±0.1 dB)
- [ ] Frequency response matches target (±1 dB)
- [ ] THD+N below spec threshold

### Performance

- [ ] CPU < budget at 44.1, 48, 96 kHz
- [ ] Latency < budget
- [ ] No memory allocations in audio thread
- [ ] No memory leaks
- [ ] Real-time safety verified

### Host Integration

- [ ] Parameter automation works
- [ ] Preset save/load works
- [ ] Bypass behavior correct
- [ ] No stuck notes (MIDI plugins)
- [ ] Latency reporting accurate
- [ ] Plugin scan time < 5 seconds

### UI Quality

- [ ] All controls respond correctly
- [ ] Parameter updates reflect in UI
- [ ] Responsive layout works at min/max sizes
- [ ] No UI stuttering
- [ ] Contrast ratios WCAG AA compliant

## QA Probe Testing

### Headless Audio Test

Run automated audio tests:

```bash
# Basic probe
/vst-validate --probe --duration 5.0 --sample-rate 48000

# With parameter overrides
/vst-validate --probe --param gain=0.5 --param freq=1000

# CPU profiling
/vst-validate --probe --cpu --block-size 64

# Latency measurement
/vst-validate --probe --latency --input-channels 2 --output-channels 2
```

### Expected Metrics

| Metric | Target | Pass/Fail |
|--------|--------|-----------|
| RMS output | -12.0 dB ± 1.0 | [ ] |
| Peak sample | < 0.1 (-20 dBFS) | [ ] |
| DC offset | < 0.001 | [ ] |
| Stereo correlation | > 0.7 | [ ] |
| Spectral centroid | Match reference | [ ] |

### Performance Metrics

| Sample Rate | Block Size | CPU Target | CPU Actual | Pass/Fail |
|-------------|------------|------------|------------|-----------|
| 44.1 kHz | 64 samples | < 1% | [ ]% | [ ] |
| 48 kHz | 64 samples | < 1% | [ ]% | [ ] |
| 96 kHz | 128 samples | < 2% | [ ]% | [ ] |

## Acceptance Tests

### Tone Checks

**Level Matching:**
```cpp
// Test: Output matches input within ±0.1 dB at default settings
float input = 0.25f;  // -12 dBFS
float output = process(input);
float expected_dB = 20.0f * std::log10(std::abs(output));
float actual_dB = 20.0f * std::log10(std::abs(input));
float error = std::abs(expected_dB - actual_dB);
assert(error < 0.1f);  // Pass
```

**Frequency Response:**
```cpp
// Test: At 1kHz, LPF should have <0.5 dB gain
float response = measureFrequencyResponse(1000.0f);
assert(response > -0.5f);  // Pass
```

**Reference Matching:**
```cpp
// Test: Output matches reference plugin within ±1 dB
float plugin_output = process(input);
float ref_output = reference_plugin.process(input);
float error_dB = 20.0f * std::log10(std::abs(plugin_output) / std::abs(ref_output));
assert(std::abs(error_dB) < 1.0f);  // Pass
```

### Artifact Checks

**Zipper Noise:**
```cpp
// Test: Smooth parameter changes produce no zipper noise
float initial_gain = 0.0f;
float target_gain = 1.0f;
for (int i = 0; i < 1000; ++i) {
    float gain = initial_gain + (target_gain - initial_gain) * (i / 1000.0f);
    float output = process_with_gain(input, gain);
    // Check for discontinuities in spectral analysis
}
```

**Aliasing:**
```cpp
// Test: At 20kHz input, output has no alias products above -100 dBFS
float input = generate_sine(20000.0f, sampleRate);
float output = process(input);
float alias_floor = measure_alias_floor(output, sampleRate);
assert(alias_floor < -100.0f);  // Pass
```

**Foldback:**
```cpp
// Test: At high frequencies, no foldback fizz
float input = generate_sine(30000.0f, sampleRate);
float output = process(input);
float non_harmonic = measure_non_harmonic_products(output, sampleRate);
assert(non_harmonic < -100.0f);  // Pass
```

### Stability Checks

**NaN/Inf:**
```cpp
// Test: At parameter extremes, output never contains NaN or Inf
for (int i = 0; i < 1000000; ++i) {
    float output = process(1.0f);  // Max input
    assert(!std::isnan(output));
    assert(std::isfinite(output));
}
// Pass if no assertions fail
```

**Automation Stress:**
```cpp
// Test: Survives DAW automation loops without crash
for (int loop = 0; loop < 100; ++loop) {
    for (int i = 0; i < 1000; ++i) {
        float param = 0.5f + 0.4f * std::sin(i / 100.0f);
        set_parameter(param);
        float output = process(input);
    }
}
// Pass if no crashes
```

### Performance Checks

**CPU Budget:**
```cpp
// Test: CPU usage < 1% at 48kHz, 64 samples
auto start = std::chrono::high_resolution_clock::now();
for (int i = 0; i < 100000; ++i) {
    process(buffer);
}
auto end = std::chrono::high_resolution_clock::now();
auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
float cpu_percent = (duration.count() / 100000.0f) / 64.0f * 48000.0f / 1000000.0f * 100.0f;
assert(cpu_percent < 1.0f);  // Pass
```

**Latency:**
```cpp
// Test: Reported latency ≤ 16 samples
int reported_latency = get_latency();
assert(reported_latency <= 16);  // Pass
```

### Host Integration Checks

**Automation:**
```cpp
// Test: All parameters automatable via DAW automation
for (int param_id = 0; param_id < num_params; ++param_id) {
    bool is_automatable = param_is_automatable(param_id);
    assert(is_automatable);  // Pass
}
```

**Preset Save/Load:**
```cpp
// Test: Preset saves and restores all parameter values exactly
set_all_parameters_to_random();
save_preset("test_preset");
set_all_parameters_to_zero();
load_preset("test_preset");
for (int param_id = 0; param_id < num_params; ++param_id) {
    float saved = get_saved_param_value(param_id);
    float current = get_current_param_value(param_id);
    float error = std::abs(saved - current);
    assert(error < 0.001f);  // Pass
}
```

**Bypass Behavior:**
```cpp
// Test: Bypass produces silent output with correct latency
set_bypass(true);
float output = process(input);
assert(output == 0.0f);  // Pass
int bypass_latency = get_latency();
set_bypass(false);
int normal_latency = get_latency();
assert(bypass_latency == normal_latency);  // Pass
```

## Test Signals

### Sine Sweep

```cpp
// 20 Hz to 20 kHz logarithmic sweep
float generate_log_sweep(float duration, float sampleRate) {
    std::vector<float> signal(duration * sampleRate);
    for (int i = 0; i < signal.size(); ++i) {
        float t = i / sampleRate;
        float freq = 20.0f * std::pow(1000.0f, t / duration);
        float phase += 2.0f * M_PI * freq / sampleRate;
        signal[i] = std::sin(phase);
    }
    return signal;
}
```

### Impulse

```cpp
// Single sample at 0 dBFS
float generate_impulse(int sampleRate) {
    std::vector<float> signal(sampleRate);
    signal[0] = 1.0f;
    return signal;
}
```

### Noise

```cpp
// White noise
float generate_noise(int numSamples) {
    std::vector<float> signal(numSamples);
    for (int i = 0; i < numSamples; ++i) {
        signal[i] = (rand() / float(RAND_MAX) - 0.5f) * 2.0f;
    }
    return signal;
}
```

## Debug Tools

### Spectrum Analysis

- Check for aliasing
- Verify filter shapes
- Identify distortion products

### Level Metering

- RMS measurement
- Peak detection
- LUFS calculation

### CPU Profiling

- Identify hotspots
- Measure per-function overhead
- Find allocation violations

## Failure Handling

If any test fails:

1. **Log the failure:**
   - Test name
   - Expected value
   - Actual value
   - File and line number

2. **Diagnose the cause:**
   - Is it a spec requirement?
   - Is it a performance target?
   - Is it a stability issue?

3. **Propose a fix:**
   - Code change (DSP bug)
   - Architecture change (wrong approach)
   - Spec change (unrealistic requirement)

## Completion Checklist

Validation phase is complete when ALL are true:

- [ ] Build quality verified (zero warnings)
- [ ] All acceptance tests pass (tone, artifacts, stability, performance)
- [ ] QA probe metrics meet targets
- [ ] No known bugs or crashes
- [ ] Performance meets spec targets
- [ ] Host integration verified

## Output Format

Report validation results:

```markdown
# Validation Complete

## Build Quality
✓ Zero warnings
✓ Compiles on target platforms
✓ No deprecated APIs

## Audio Quality
| Test | Target | Actual | Pass/Fail |
|------|--------|--------|-----------|
| Level matching | ±0.1 dB | [X] dB | ✅ |
| Frequency response | ±1 dB | [X] dB | ✅ |
| THD+N | < -80 dB | [X] dB | ✅ |
| Aliasing | < -100 dB | [X] dB | ✅ |

## Performance
| Sample Rate | Block Size | CPU Target | CPU Actual | Pass/Fail |
|-------------|------------|------------|------------|-----------|
| 44.1 kHz | 64 samples | < 1% | [ ]% | ✅ |
| 48 kHz | 64 samples | < 1% | [ ]% | ✅ |
| 96 kHz | 128 samples | < 2% | [ ]% | ✅ |

## Host Integration
✓ Parameter automation works
✓ Preset save/load works
✓ Bypass behavior correct
✓ Latency reporting accurate

## QA Probe Results
- RMS output: [X] dB (target: -12.0 dB ± 1.0)
- Peak sample: [X] (target: < 0.1)
- DC offset: [X] (target: < 0.001)
- Stereo correlation: [X] (target: > 0.7)

## Known Issues
[None or list]

## Recommendations
[Optional improvements]

## Phase Gate
✓ Validation complete
✓ Plugin ready for release
```

## Do Not

Do not:
- Skip acceptance tests
- Ignore performance targets
- Skip QA probe testing
- Validate incomplete implementations

## Ask Before

Ask the orchestrator before:
- Declaring validation complete with failures
- Modifying acceptance tests
- Changing performance targets

Return to orchestrator when validation is complete and all tests pass.