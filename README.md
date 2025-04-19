# Drag and Drop Organisable Tree Demo (in React with dnd-kit)

This simple demo shows how to make a playlist organiser in React using dnd-kit, a lightweight, modular and extensible drag & drop toolkit for React. 


In this demo we simulate a playlist organiser where playlist can be added to folders, folders can have sub-folders, but playlists cant have any children items.

This demo is simple but aims to teach developers the basics of using dnd-kit for nested lists with constraints (like playlists can't have children).


## Basic Demo



<div align="center">
    <img src="./Screenshot Basic Demo.png" alt="dnd-kit Demo" style="width:50%; height:auto;">
</div>

Try demo here: [https://peter-sb.github.io/dnd-kit-folder-demo/](https://peter-sb.github.io/dnd-kit-folder-demo/)


## Install dnd-kit

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Technical Explanation

### What is dnd-kit?

[dnd-kit](https://docs.dndkit.com/) is a lightweight, modular, and extensible drag & drop toolkit for React. It gives you the building blocks to easily create custom drag-and-drop components for your projects.

### **Key Concepts in dnd-kit**

#### 1. DndContext

The DndContext is the heart of dnd-kit. It acts as a container for all your drag-and-drop interactions. Wrap your draggable and droppable components inside this context, and it handles the communication between them.

What it does: Tracks drag events, manages sensors (like mouse or touch), and coordinates draggable and droppable elements. 

```
<DndContext
  sensors={sensors} // Detects user input (e.g., mouse or touch)
  onDragStart={handleDragStart} // Called when dragging starts
  onDragOver={handleDragOver} // Called when dragging over a droppable area
  onDragEnd={handleDragEnd} // Called when dragging ends
>
  {/* Your draggable and droppable components go here */}
</DndContext>
```

#### 2. Draggable Items

Draggable items are the elements you want users to move around. You make them draggable using the useDraggable hook. The useDraggable hook provides props like listeners, attributes, and setNodeRef that you attach to the draggable element. 

```
const { attributes, listeners, setNodeRef } = useDraggable({ id: 'item-1' });

return (
  <div ref={setNodeRef} {...listeners} {...attributes} style={{ cursor: 'grab' }}>
    Drag Me!
  </div>
);
```

#### 3. Droppable Areas

Droppable areas are where draggable items can be dropped. You make them droppable using the useDroppable hook. The useDroppable hook provides a setNodeRef function to attach to the droppable area and a isOver property to check if an item is being dragged over it.

```
const { setNodeRef, isOver } = useDroppable({ id: 'drop-zone-1' });

return (
  <div ref={setNodeRef} style={{ backgroundColor: isOver ? 'lightblue' : 'white' }}>
    Drop Here
  </div>
);
```

#### 4. Sensors

Sensors detect user input (like mouse, touch, or keyboard) and translate it into drag-and-drop actions. The most common sensor is the PointerSensor.

How to use sensors:

```
const sensors = useSensors(useSensor(PointerSensor));
```

#### 5. DragOverlay

The DragOverlay is a special component that renders the item being dragged. It allows you to customise how the dragged item looks while it's being moved.

Example:

```
<DragOverlay>
  {activeItem ? <div>{activeItem.title}</div> : null}
</DragOverlay>
```

### Why IDs Are Important
Every draggable and droppable element in dnd-kit needs a unique id.

This is how dnd-kit tracks what you're dragging (active.id), what you're dragging over (over.id), and what to update when a drop happens.

In this demo:

- Each playlist or folder has a unique id like folder-1, playlist-2, etc.

- Each insertion zone has an id like folder-1-insertion-0 — this is key to figuring out exactly where an item should be dropped inside its parent.



### Tips and Tricks

Use a DragOverlay: This makes the dragged item look distinct and avoids layout shifts. 
Restrict Droppable Areas: Use logic to prevent invalid drops (e.g. folders can't be dropped into their descendants). 

## Key Details Specific To This Demo

### Tree Data Structure
We store items in a tree format, where:

- Folders have a children array.
- Playlists don’t have children (This know as a leaf node). This is important because drag-drop logic needs to know what type of item you're working with.

We use recursion to render the folders children. 

### Drop Zones Between Items
Instead of just dropping on folders, we allow dropping between items using insertion zones for a nicer UI experiance. these are identified with unique droppable IDs like "folder-1-insertion-0".

### Folder Constraints
The main constraint is that you can’t drop a folder into itself or one of its descendants. This is checked during `onDragOver` and `onDragEnd` with a recursive `isDescendant()` helper. Prevents creating circular references.

### Moving Items
When an item is dropped:

- It's removed from its current location using `removeItem()`.
- It's inserted into the new folder + index using `insertItemAt()`.

We only update state (setData) if both steps are valid.


### Why Not Use dnd-kit/sortable?
dnd-kit/sortable is more useful for flat lists but this demo uses nested folders/playlists with custom constraints and insert logic so sortable isn't quite the right fit here and building the logic from scratch makes more sense.