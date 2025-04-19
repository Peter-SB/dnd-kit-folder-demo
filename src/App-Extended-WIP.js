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

// Initial demo data: folders have a children array; playlists do not.
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
// The 'indent' prop is computed from the parent's level so that the blue line aligns with the child items.
function InsertionZone({ parentId, index, activeDropTarget, indent }) {
  const droppable = useDroppable({ id: `${parentId}-insertion-${index}` });
  // Highlight this zone if it is the current drop target.
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

  const handleDragStart = event => {
    setActiveId(event.active.id);
  };

  // When dragging over an insertion zone, update activeDropTarget.
  const handleDragOver = event => {
    const { active, over } = event;
    if (over && over.id) {
      if (over.id.includes('-insertion-')) {
        const [parentId, indexStr] = over.id.split('-insertion-');
        const index = parseInt(indexStr, 10);
        const activeItem = findItemById(data, active.id);
        // If dragging a folder, ensure it is not dropped onto itself or one of its descendants.
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

  // On drag end, if over an insertion zone, remove the active item and insert it at the target index.
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

  // Render tree recursively, passing the current indentation level.
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ padding: '20px' }}>
        <h2>Playlist Organizer</h2>
        <div>{renderTree(data)}</div>
      </div>

      <DragOverlay>
        {activeItem ? (
          <div style={{ padding: '4px', background: 'lightgrey', border: '1px solid black' }}>
            {activeItem.type === 'folder'
              ? `📁 ${activeItem.title}`
              : `🎵 ${activeItem.title}`}
          </div>
        ) : null}
      </DragOverlay>
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

// FolderItem: renders a folder with a small grab zone, an expand/collapse toggle, and its label.
// It also renders insertion zones and its children when expanded.
function FolderItem({ item, level, activeDropTarget, activeItem }) {
  const [expanded, setExpanded] = useState(true);
  // Set up the draggable hook for the folder's grab handle.
  const { attributes, listeners, setNodeRef, transform, transition } = useDraggable({ id: item.id });
  const headerIndent = level * 20; // linear indent per level

  // Style for the small grab zone icon.
  const handleStyle = {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    marginRight: '4px',
    border: '1px solid #ccc',
    borderRadius: '3px',
    backgroundColor: 'white',
    flexShrink: 0,
  };

  // Folder header container style.
  const headerStyle = {
    marginLeft: `${headerIndent}px`,
    display: 'flex',
    alignItems: 'center',
    marginBottom: '4px',
    marginTop: '4px',
  };

  return (
    <div>
      <div style={headerStyle}>
        {/* Draggable grab handle */}
        <span ref={setNodeRef} {...listeners} {...attributes} style={handleStyle}>
          ≡
        </span>
        {/* Expand/Collapse button if there are children */}
        {item.children && item.children.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ marginRight: '4px', cursor: 'pointer' }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        <span>
          📁 {item.title}
        </span>
      </div>
      {/* Render children and insertion zones only if expanded */}
      {expanded && (
        <>
          {(!item.children || item.children.length === 0) ? (
            <InsertionZone
              parentId={item.id}
              index={0}
              activeDropTarget={activeDropTarget}
              indent={(level + 1) * 20}
            />
          ) : (
            <>
              <InsertionZone
                parentId={item.id}
                index={0}
                activeDropTarget={activeDropTarget}
                indent={(level + 1) * 20}
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
                  <InsertionZone
                    parentId={item.id}
                    index={i + 1}
                    activeDropTarget={activeDropTarget}
                    indent={(level + 1) * 20}
                  />
                </React.Fragment>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

// PlaylistItem: a simple draggable component for playlists.
function PlaylistItem({ item, level }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useDraggable({ id: item.id });
  const indentStyle = { marginLeft: `${level * 20}px`, marginTop: '4px', marginBottom: '4px' };
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
