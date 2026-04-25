import { useState, useRef, useEffect, type KeyboardEvent } from 'react';

interface UsernameBadgeProps {
  username: string;
  onUsernameChange: (newUsername: string) => void;
}

export default function UsernameBadge({ username, onUsernameChange }: UsernameBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(username);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed.length <= 9) {
      onUsernameChange(trimmed);
    } else {
      setEditValue(username); // revert
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(username);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="username-badge__input"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        maxLength={9}
        placeholder="İsim?"
      />
    );
  }

  return (
    <button
      className="username-badge"
      onClick={() => { setEditValue(username); setIsEditing(true); }}
      title="Kullanıcı adını değiştir"
    >
      <span className="username-badge__text">{username}</span>
    </button>
  );
}
