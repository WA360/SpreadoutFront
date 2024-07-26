import { useEffect, useCallback } from 'react';

export type ShortcutConfig = {
  [key: string]: string;
};

export const useDirectInsertShortcut = (config: ShortcutConfig) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.altKey && config[event.key]) {
        event.preventDefault();
        const text = config[event.key];
        insertTextToActiveElement(text);
      }
    },
    [config],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);

  const insertTextToActiveElement = (text: string) => {
    const activeElement = document.activeElement as
      | HTMLInputElement
      | HTMLTextAreaElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA')
    ) {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const value = activeElement.value;

      if (start !== null && end !== null) {
        activeElement.value = value.slice(0, start) + text + value.slice(end);
        activeElement.setSelectionRange(
          start + text.length,
          start + text.length,
        );
      }

      // 변경 이벤트를 발생시켜 React 상태를 업데이트합니다
      const event = new Event('input', { bubbles: true });
      activeElement.dispatchEvent(event);
    }
  };

  const getShortcuts = useCallback(() => {
    return Object.entries(config).map(([key, text]) => ({
      key,
      text,
    }));
  }, [config]);

  return { getShortcuts };
};

export const defaultShortcutConfig: ShortcutConfig = {
  '1': '총균쇠보다 더 중요한 개념이 어디서 나와?',
  '2': `여기서 흥미로운 내용이 나오는 단원이 있어?\n<div style="display:none">12장 에서 찾아</div>`,
};
