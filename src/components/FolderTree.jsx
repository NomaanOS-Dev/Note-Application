// src/components/FolderTree.jsx
import { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'

export default function FolderTree({ folders, active, onSelect, countFor }) {
  const tree = buildTree(folders)
  return (
    <div className="folder-tree">
      {tree.map(node => (
        <FolderNode
          key={node.path}
          node={node}
          active={active}
          onSelect={onSelect}
          countFor={countFor}
          depth={0}
        />
      ))}
    </div>
  )
}

function FolderNode({ node, active, onSelect, countFor, depth }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children.length > 0
  const isActive = active === `Folder:${node.path}`

  return (
    <div className="folder-node">
      <div
        className={`folder-node-row ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="folder-caret"
            onClick={e => {
              e.stopPropagation()
              setOpen(v => !v)
            }}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <span className="folder-caret-spacer" />
        )}

        <button
          type="button"
          className="folder-label"
          onClick={() => onSelect(`Folder:${node.path}`)}
        >
          {open && hasChildren ? <FolderOpen size={15} /> : <Folder size={15} />}
          <span>{node.name}</span>
          <small>{countFor(`Folder:${node.path}`) || 0}</small>
        </button>
      </div>

      {open && hasChildren && (
        <div className="folder-children">
          {node.children.map(child => (
            <FolderNode
              key={child.path}
              node={child}
              active={active}
              onSelect={onSelect}
              countFor={countFor}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function buildTree(paths) {
  const root = []

  for (const path of paths) {
    const parts = path.split('/').filter(Boolean)
    let cursor = root
    let accumulated = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      accumulated = accumulated ? `${accumulated}/${part}` : part

      let existing = cursor.find(n => n.name === part)
      if (!existing) {
        existing = { name: part, path: accumulated, children: [] }
        cursor.push(existing)
      }
      cursor = existing.children
    }
  }

  return root
}