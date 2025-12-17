# Counter Application Example

A simple counter application demonstrating **Catalyst** features including:
- Page state management
- Event handlers (onClick)
- Logic flows with multiple node types
- Reactive UI updates

## Features Demonstrated

### Page State
- `count` (number) - The current counter value, initialized to 0

### Components
1. **CounterApp** - Main container with centered layout
2. **Title** - Application heading
3. **CountDisplay** - Shows the current count using `{{state.count}}` template
4. **ButtonGroup** - Container for action buttons
5. **IncrementButton** - Increases count by 1
6. **DecrementButton** - Decreases count by 1  
7. **ResetButton** - Resets count to 0
8. **AlertButton** - Shows a browser alert

### Logic Flows
1. **flow_increment** - onClick → setState(count, increment, 1) → console.log
2. **flow_decrement** - onClick → setState(count, decrement, 1) → console.log  
3. **flow_reset** - onClick → setState(count, set, 0) → console.log
4. **flow_alert** - onClick → alert("Hello from Catalyst!")

## How to Use

1. Open Catalyst application
2. Use **File > Open Project** and select the `examples/counter-app` directory
3. The manifest will load and you'll see the component tree
4. Click **Generate** to create React code
5. The preview will show the counter application
6. Click buttons to test the logic flows!

## Expected Behavior

- **+ Increment**: Count increases by 1, console logs "Counter incremented!"
- **- Decrement**: Count decreases by 1, console logs "Counter decremented!"
- **Reset**: Count becomes 0, console logs "Counter reset to 0"
- **Show Alert**: Browser shows alert "Hello from Catalyst! The counter app is working."

## Generated Code Structure

After generation, the `/src` folder will contain:

```
src/
├── App.jsx           # Main app with state and handlers
├── PageStateRuntime.jsx  # Reactive state context
├── components/
│   ├── CounterApp.jsx
│   ├── Title.jsx
│   ├── CountDisplay.jsx
│   ├── CountText.jsx
│   ├── ButtonGroup.jsx
│   ├── IncrementButton.jsx
│   ├── DecrementButton.jsx
│   ├── ResetButton.jsx
│   └── AlertButton.jsx
├── index.jsx
└── index.css
```

## Level 1.5 Features Used

| Feature | Used In |
|---------|---------|
| onClick events | All buttons |
| setState action | Increment, Decrement, Reset flows |
| alert action | Alert flow |
| console action | All flows |
| Page state | `count` variable |
| Template interpolation | CountText (`{{state.count}}`) |

---

This example was created to demonstrate the Catalyst workflow builder's capability to create interactive applications using visual logic flows.
