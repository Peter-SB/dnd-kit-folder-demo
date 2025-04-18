import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';

// Initial demo data: folders have a children array, playlists do not.
const initialData = [
  {
    id: 'folder-1',
    type: 'folder',
    title: 'Folder 1',
    children: [
      {
        id: 'folder-2',
        type: 'folder',
        title: 'Subfolder 1',
        children: [
          {
            id: 'playlist-1',
            type: 'playlist',
            title: 'Playlist 1',
          },
        ],
      },
      {
        id: 'playlist-2',
        type: 'playlist',
        title: 'Playlist 2',
      },
    ],
  },
  {
    id: 'folder-3',
    type: 'folder',
    title: 'Folder 2',
    children: [
      {
        id: 'playlist-3',
        type: 'playlist',
        title: 'Playlist 3',
      },
    ],
  },
  {
    id: 'folder-4',
    type: 'folder',
    title: 'Folder 3',
    children: [
      {
        id: 'playlist-4',
        type: 'playlist',
        title: 'Playlist 4',
      },
    ],
  },
];

// Helper to remove an item from the tree.
function removeItem(tree, id) {
  let removed = null;
  const filterItems = items =>
    items.filter(item => {
      if (item.id === id) {
        removed = item;
        return false;
      }
      if (item.children) {
        item.children = filterItems(item.children);
      }
      return true;
    });
  const newTree = filterItems(tree);
  return { newTree, removed };
}

// Helper to insert an item into a folder at a given index.
function insertItemAt(tree, parentId, index, item) {
  const insert = items =>
    items.map(i => {
      if (i.id === parentId) {
        if (!i.children) i.children = [];
        const newChildren = [...i.children];
        newChildren.splice(index, 0, item);
        return { ...i, children: newChildren };
      }
      if (i.children) {
        return { ...i, children: insert(i.children) };
      }
      return i;
    });
  return insert(tree);
}

// Recursively find an item in the tree.
function findItemById(items, id) {
  for (let item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Check whether a folder has a given descendant.
function isDescendant(folder, descendantId) {
  if (!folder.children) return false;
  for (let child of folder.children) {
    if (child.id === descendantId) return true;
    if (child.children && isDescendant(child, descendantId)) return true;
  }
  return false;
}

// InsertionZone component: a droppable area for inserting an item at a specific index.
// The 'indent' prop is computed from the parent's level.
function InsertionZone({ parentId, index, activeDropTarget, indent }) {
  const droppable = useDroppable({ id: `${parentId}-insertion-${index}` });
  // Highlight if this zone is the current drop target.
  const isActive =
    droppable.isOver &&
    activeDropTarget &&
    activeDropTarget.parentId === parentId &&
    activeDropTarget.index === index;
  return (
    <div
      ref={droppable.setNodeRef}
      style={{
        height: '2px',
        backgroundColor: isActive ? 'blue' : 'transparent',
        margin: '2px 0',
        marginLeft: `${indent}px`,
      }}
    />
  );
}

function App() {
  const [data, setData] = useState(initialData);
  const [activeId, setActiveId] = useState(null);
  // activeDropTarget: an object { parentId, index } indicating the currently highlighted insertion zone.
  const [activeDropTarget, setActiveDropTarget] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor));

  // When drag starts, keep active id.
  const handleDragStart = event => {
    setActiveId(event.active.id);
  };

  // When dragging over, if the droppable id indicates an insertion zone, update activeDropTarget.
  const handleDragOver = event => {
    const { active, over } = event;
    if (over && over.id) {
      if (over.id.includes('-insertion-')) {
        const [parentId, indexStr] = over.id.split('-insertion-');
        const index = parseInt(indexStr, 10);
        const activeItem = findItemById(data, active.id);
        // For folders being dragged, check valid drop: can't drop on itself or its descendant.
        if (activeItem && activeItem.type === 'folder') {
          if (active.id === parentId || isDescendant(activeItem, parentId)) {
            setActiveDropTarget(null);
            return;
          }
        }
        setActiveDropTarget({ parentId, index });
      } else {
        setActiveDropTarget(null);
      }
    } else {
      setActiveDropTarget(null);
    }
  };

  // When drag ends, if the drop target is an insertion zone, remove and reinsert at the specified index.
  const handleDragEnd = event => {
    const { active, over } = event;
    if (over && over.id && over.id.includes('-insertion-')) {
      const [parentId, indexStr] = over.id.split('-insertion-');
      const index = parseInt(indexStr, 10);
      const activeItem = findItemById(data, active.id);
      if (activeItem && activeItem.type === 'folder') {
        if (active.id === parentId || isDescendant(activeItem, parentId)) {
          setActiveDropTarget(null);
          setActiveId(null);
          return;
        }
      }
      const { newTree, removed } = removeItem(data, active.id);
      if (removed) {
        const updatedTree = insertItemAt(newTree, parentId, index, removed);
        setData(updatedTree);
      }
    }
    setActiveId(null);
    setActiveDropTarget(null);
  };

  // Look up the active draggable item using activeId.
  const activeItem = activeId ? findItemById(data, activeId) : null;

  // Render tree recursively.
  // Pass down the level to children, and each item computes its own margin.
  const renderTree = (items, level = 0) =>
    items.map(item =>
      item.type === 'folder' ? (
        <FolderItem
          key={item.id}
          item={item}
          level={level}
          activeDropTarget={activeDropTarget}
          activeItem={activeItem}
        />
      ) : (
        <PlaylistItem key={item.id} item={item} level={level} />
      )
    );

  return (
    <DndContext // Container for all the dnd-kit activity with parameters to declare behaviour
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ padding: '20px', paddingLeft: '80px', width: '300px' }}>
        <h2 style={{
          borderBottom: '1px solid grey',
          width: 'full',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          Playlist Organiser
          <a href="https://github.com/Peter-SB/dnd-kit-folder-demo" target="_blank" rel="noopener noreferrer">
            <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" style={{ width: '30px', height: '30px', paddingTop: '10px', paddingLeft: '20px' }} />
          </a>
        </h2>
        {/* Render the tree structure of folders and playlists */}
        <div>{renderTree(data)}</div>
      </div>

      {/* Optional: DragOverlay changes how the item being dragged is displayed */}
      {/* <DragOverlay>
      </DragOverlay> */}
    </DndContext>
  );
}

// A common draggable component.
function DraggableItem({ id, children, style, listeners, attributes, draggableRef }) {
  return (
    <div ref={draggableRef} {...listeners} {...attributes} style={style}>
      {children}
    </div>
  );
}

// FolderItem: renders a folder with its label and its children along with insertion zones.
function FolderItem({ item, level, activeDropTarget, activeItem }) {
  const { attributes, listeners, setNodeRef: setDraggableRef, transform, transition } =
    useDraggable({ id: item.id });
  const indentStyle = { marginLeft: `${level * 30}px`, marginTop: '1px', marginBottom: '1px' };
  const draggableStyle = {
    ...indentStyle,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    transition,
    padding: '4px',
    border: '1px solid gray',
    backgroundColor: 'white',
    cursor: 'grab',
    display: 'inline-block',
  };

  return (
    <>
      <div>
        <DraggableItem
          id={item.id}
          draggableRef={setDraggableRef}
          listeners={listeners}
          attributes={attributes}
          style={draggableStyle}
        >
          📁 {item.title}
        </DraggableItem>
      </div>
      {/* Render children and insertion zones without extra container margin */}
      {item.children && item.children.length > 0 ? (
        <>
          {/* Insertion zone before the first child; indent based on parent's level */}
          <InsertionZone
            parentId={item.id}
            index={0}
            activeDropTarget={activeDropTarget}
            indent={(level + 1) * 30}
          />
          {item.children.map((child, i) => (
            <React.Fragment key={child.id}>
              {child.type === 'folder' ? (
                <FolderItem
                  item={child}
                  level={level + 1}
                  activeDropTarget={activeDropTarget}
                  activeItem={activeItem}
                />
              ) : (
                <PlaylistItem item={child} level={level + 1} />
              )}
              {/* Insertion zone after each child */}
              <InsertionZone
                parentId={item.id}
                index={i + 1}
                activeDropTarget={activeDropTarget}
                indent={(level + 1) * 30}
              />
            </React.Fragment>
          ))}
        </>
      ) : (
        // If no children, render a single insertion zone at index 0.
        <InsertionZone
          parentId={item.id}
          index={0}
          activeDropTarget={activeDropTarget}
          indent={(level + 1) * 30}
        />
      )}
    </>
  );
}

// PlaylistItem: a simple draggable component.
function PlaylistItem({ item, level }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useDraggable({ id: item.id });
  const indentStyle = { marginLeft: `${level * 30}px`, marginTop: '1px', marginBottom: '1px' };
  const draggableStyle = {
    ...indentStyle,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    transition,
    padding: '4px',
    border: '1px solid gray',
    backgroundColor: 'white',
    cursor: 'grab',
    display: 'inline-block',
  };
  return (
    <DraggableItem
      id={item.id}
      draggableRef={setNodeRef}
      listeners={listeners}
      attributes={attributes}
      style={draggableStyle}
    >
      🎵 {item.title}
    </DraggableItem>
  );
}

export default App;
