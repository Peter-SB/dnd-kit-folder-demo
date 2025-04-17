# Drag and Drop Kit React Demo with Folders

This simple demo shows how to make a playlist organiser. Here playlist can be added to folders, folders can have sub-folders, but playlists cant have any children items.

Drag and Drop Kit, (dnd-kit) library provides the basis of the code.

## Basic Demo

Try here: [https://peter-sb.github.io/dnd-kit-folder-demo/](https://peter-sb.github.io/dnd-kit-folder-demo/)

This basic version includes just the folder and playlists, with a blue indicator for where you are placing the selected item.

<div align="center">
    <img src="./Screenshot Basic Demo.png" alt="dnd-kit Demo" style="width:50%; height:auto;">
</div>

## Install dnd-kit

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Technical Explanation

### What is dnd-kit?

dnd-kit is a lightweight and flexible drag-and-drop library for React. It gives you the building blocks to create custom drag-and-drop experiences without being tied to specific UI components. Think of it as a toolkit for drag-and-drop interactions.

### **Key Concepts in dnd-kit**

#### 1. DndContext

The DndContext is the heart of dnd-kit. It acts as a container for all drag-and-drop interactions. You wrap your draggable and droppable components inside this context, and it handles the communication between them.

What it does: Tracks drag events, manages sensors (like mouse or touch), and coordinates draggable and droppable elements.
How to use it:

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

Draggable items are the elements you want users to move around. You make them draggable using the useDraggable hook.

How it works: The useDraggable hook provides props like listeners, attributes, and setNodeRef that you attach to the draggable element.
Example:
```
const { attributes, listeners, setNodeRef } = useDraggable({ id: 'item-1' });

return (
  <div ref={setNodeRef} {...listeners} {...attributes} style={{ cursor: 'grab' }}>
    Drag Me!
  </div>
);
```

#### 3. Droppable Areas

Droppable areas are where draggable items can be dropped. You make them droppable using the useDroppable hook.

How it works: The useDroppable hook provides a setNodeRef function to attach to the droppable area and a isOver property to check if an item is being dragged over it.
Example:

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

The DragOverlay is a special component that renders the item being dragged. It allows you to customize how the dragged item looks while it's being moved.

Example:

```
<DragOverlay>
  {activeItem ? <div>{activeItem.title}</div> : null}
</DragOverlay>
```

## Building a Playlist Organizer with dnd-kit

### Step 1: Define Your Data

Start with a tree-like structure for folders and playlists. Each folder can have children, while playlists cannot.

```
const initialData = [
  {
    id: 'folder-1',
    type: 'folder',
    title: 'Folder 1',
    children: [
      { id: 'playlist-1', type: 'playlist', title: 'Playlist 1' },
      { id: 'playlist-2', type: 'playlist', title: 'Playlist 2' },
    ],
  },
];
```

### Step 2: Make Items Draggable

Use the useDraggable hook to make folders and playlists draggable. Attach the provided props to a small "grab handle" for better UX.

```
const { attributes, listeners, setNodeRef } = useDraggable({ id: item.id });

return (
  <div>
    <span ref={setNodeRef} {...listeners} {...attributes} style={{ cursor: 'grab' }}>
      ≡
    </span>
    {item.title}
  </div>
);
```

### Step 3: Add Droppable Zones

Use the useDroppable hook to create areas where items can be dropped. For example, you can add "insertion zones" between items.

```
const { setNodeRef, isOver } = useDroppable({ id: `${parentId}-insertion-${index}` });

return (
  <div ref={setNodeRef} style={{ height: '2px', backgroundColor: isOver ? 'blue' : 'transparent' }} />
);
```

### Step 4: Handle Drag Events

Use the onDragStart, onDragOver, and onDragEnd callbacks in DndContext to manage the drag-and-drop logic.

```
const handleDragEnd = event => {
  const { active, over } = event;
  if (over) {
    // Update your data structure to reflect the new position
  }
};
```

Example:

## Tips and Tricks

Use a DragOverlay: This makes the dragged item look distinct and avoids layout shifts.
Restrict Droppable Areas: Use logic to prevent invalid drops (e.g., folders can't be dropped into their descendants).
Debugging: Use console.log in your drag event handlers to see what's happening during a drag.
