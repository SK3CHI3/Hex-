import React, { useEffect, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import { getTheme } from './themes.js';

const getPosition = (node) => {
  let x = 0;
  let y = 0;
  let yogaNode = node?.yogaNode;
  while (yogaNode) {
    x += yogaNode.getComputedLeft?.() || 0;
    y += yogaNode.getComputedTop?.() || 0;
    yogaNode = yogaNode.getParent?.();
  }
  return { x, y };
};

const DetailViewer = ({ detail, maxHeight, onClose, onRegisterHitTarget }) => {
  const theme = getTheme();
  const [page, setPage] = useState(0);
  const headerRef = useRef(null);
  const bodyRef = useRef(null);
  const lines = String(detail.content || '').split('\n');
  const pageSize = Math.max(1, maxHeight - 3);
  const pageCount = Math.max(1, Math.ceil(lines.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * pageSize;

  useEffect(() => setPage(0), [detail.id]);
  useEffect(() => {
    if (!headerRef.current) return undefined;
    const { x, y } = getPosition(headerRef.current);
    onRegisterHitTarget('detail-close', { x, y, width: headerRef.current.yogaNode?.getComputedWidth?.() || 1, height: 1, onClick: onClose });
    return () => onRegisterHitTarget('detail-close', null);
  });
  useEffect(() => {
    if (!bodyRef.current || pageCount < 2) return undefined;
    const { x, y } = getPosition(bodyRef.current);
    onRegisterHitTarget('detail-next', {
      x, y, width: bodyRef.current.yogaNode?.getComputedWidth?.() || 1,
      height: bodyRef.current.yogaNode?.getComputedHeight?.() || 1,
      onClick: () => setPage(value => (value + 1) % pageCount),
    });
    return () => onRegisterHitTarget('detail-next', null);
  });

  return React.createElement(Box, { flexDirection: 'column', height: maxHeight, overflow: 'hidden' },
    React.createElement(Box, { ref: headerRef }, React.createElement(Text, { color: theme.status.info, bold: true }, `← ${detail.title}  [click to close]`)),
    React.createElement(Box, { ref: bodyRef, flexDirection: 'column', flexGrow: 1, overflow: 'hidden' },
      ...lines.slice(start, start + pageSize).map((line, index) => React.createElement(Text, { key: `${start + index}`, color: theme.text.primary, wrap: 'truncate' }, line || ' '))
    ),
    React.createElement(Text, { color: theme.text.muted }, pageCount > 1
      ? `Lines ${start + 1}-${Math.min(start + pageSize, lines.length)} of ${lines.length} · click output for next page`
      : `${lines.length} line${lines.length === 1 ? '' : 's'}`)
  );
};

export default DetailViewer;
