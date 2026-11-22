/* eslint-disable */
/**
 * Session groups — browser half.
 *
 * Additive surfaces only, every registration fills an existing seat:
 *  - `sidebar.panellist` + `main`: a "会话分组" navigation row and its group board
 *    (horizontal group rows, five cards by two rows per page).
 *  - `sidebar.session.row.leading`: a group colour dot in the row's idle cell.
 *  - `sidebar.session.row.hover`: the group name inside the row hover card.
 *  - `sidebar.workspaces.session.menu.item` + `shell.overlay`: "归入分组…" and its picker.
 *
 * Membership is browser-local UI state (localStorage), keyed by durable Session id.
 */
window.__ModuleLoader__.load({
  id: 'dsh-session-group-board',
  factory(require) {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const h = React.createElement;

    /** localStorage key; bump the suffix only for a breaking shape change. */
    const STORAGE_KEY = 'dsh.session-categories.v1';
    /** Sidebar row id and main-panel key; one identity drives both. */
    const PANEL_ID = 'session-categories';
    /** Auto-assigned per-category accent colours. */
    const COLORS = [
      '#4f8cf7', '#8a6df1', '#e2683c', '#34a06b',
      '#c9a227', '#d6538a', '#3aa6b9', '#7d8794',
    ];

    const zh = /^zh/i.test((typeof navigator === 'object' && navigator.language) || 'zh');

    const L = zh
      ? {
        panelLabel: '会话分组',
        title: '会话分组',
        subtitle: '给会话归入自定义分组，拖动卡片即可换分组。',
        addCategory: '新建分组',
        newCategoryPlaceholder: '分组名称',
        create: '创建',
        cancel: '取消',
        rename: '重命名',
        remove: '删除',
        unclassified: '未分组',
        confirmDelete: name => `删除分组「${name}」？该分组下的会话会回到未分组。`,
        emptyBoard: '还没有分组。点击右上角「新建分组」开始。',
        emptyColumn: '暂无会话',
        dropHint: '松开即可归入',
        setCategory: '归入分组…',
        pickTitle: '选择分组',
        pickHint: '为「{name}」选择一个分组',
        clearAssignment: '移出分组（未分组）',
        noCategoryYet: '还没有分组，先创建一个。',
        close: '关闭',
        total: n => `共 ${n} 个会话`,
        storageNote: '分组只保存在当前浏览器',
        storageFailed: '当前浏览器拒绝写入本地存储，分组在刷新后会丢失。',
        more: '更多',
        archivedTag: '已归档',
        archivedNotOpenable: '已归档，取消归档后可打开',
        pin: '置顶会话',
        unpin: '取消置顶',
        archive: '归档',
        unarchive: '取消归档',
        category: '归入分组',
        archivedCount: k => `含 ${k} 个已归档`,
        confirmStopArchive: name => `「${name}」正在运行。停止并归档？`,
        renameFailed: '重命名失败',
        archiveFailed: '归档失败',
        unarchiveFailed: '取消归档失败',
        pinFailed: '置顶失败',
        unpinFailed: '取消置顶失败',
        page: (index, pages) => `第 ${index} / ${pages} 页`,
        prevPage: '上一页',
        nextPage: '下一页',
        justNow: '刚刚',
        minutesAgo: n => `${n} 分钟前`,
        hoursAgo: n => `${n} 小时前`,
        daysAgo: n => `${n} 天前`,
      }
      : {
        panelLabel: 'Session groups',
        title: 'Session groups',
        subtitle: 'Group sessions into your own groups. Drag a card to move it.',
        addCategory: 'New group',
        newCategoryPlaceholder: 'Group name',
        create: 'Create',
        cancel: 'Cancel',
        rename: 'Rename',
        remove: 'Delete',
        unclassified: 'Ungrouped',
        confirmDelete: name => `Delete the group "${name}"? Its sessions move back to Ungrouped.`,
        emptyBoard: 'No groups yet. Use "New group" above to begin.',
        emptyColumn: 'No sessions',
        dropHint: 'Drop to assign',
        setCategory: 'Assign group…',
        pickTitle: 'Choose a group',
        pickHint: 'Pick a group for "{name}"',
        clearAssignment: 'Remove from group',
        noCategoryYet: 'No groups yet — create one first.',
        close: 'Close',
        total: n => `${n} session${n === 1 ? '' : 's'}`,
        storageNote: 'groups stay in this browser',
        storageFailed: 'This browser refused local storage, so groups will be lost on refresh.',
        more: 'More',
        archivedTag: 'Archived',
        archivedNotOpenable: 'Archived — unarchive it to open',
        pin: 'Pin session',
        unpin: 'Unpin session',
        archive: 'Archive',
        unarchive: 'Unarchive',
        category: 'Assign group',
        archivedCount: k => `${k} archived`,
        confirmStopArchive: name => `"${name}" is running. Stop it and archive?`,
        renameFailed: 'Rename failed',
        archiveFailed: 'Archive failed',
        unarchiveFailed: 'Unarchive failed',
        pinFailed: 'Pin failed',
        unpinFailed: 'Unpin failed',
        page: (index, pages) => `Page ${index} / ${pages}`,
        prevPage: 'Previous page',
        nextPage: 'Next page',
        justNow: 'now',
        minutesAgo: n => `${n}m ago`,
        hoursAgo: n => `${n}h ago`,
        daysAgo: n => `${n}d ago`,
      };

    const CSS = `
.dshsc-page{flex:1;height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}
.dshsc-head{display:flex;align-items:flex-end;gap:12px;padding:20px 24px 14px;flex-wrap:wrap}
.dshsc-title{margin:0;font-size:17px;font-weight:600;line-height:1.3}
.dshsc-sub{margin-top:4px;color:var(--dsw-alias-label-secondary);font-size:12px}
.dshsc-warn{margin-top:6px;color:var(--dsw-alias-state-warn-primary);font-size:12px}
.dshsc-grow{flex:1}
.dshsc-btn{appearance:none;border:0.5px solid var(--dsw-alias-border-l2);background:transparent;color:inherit;border-radius:7px;padding:5px 10px;font-size:12px;line-height:1.4;cursor:pointer;font-family:inherit}
.dshsc-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshsc-btn--primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.dshsc-btn--ghost{border-color:transparent;color:var(--dsw-alias-label-secondary);padding:2px 6px}
.dshsc-btn--ghost:hover{color:var(--dsw-alias-label-primary)}
.dshsc-board{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:0;padding:0 24px 24px}
.dshsc-col{display:flex;align-items:flex-start;gap:16px;padding:14px 4px;border-top:0.5px solid var(--dsw-alias-border-l1)}
.dshsc-col:first-child{border-top:0}
.dshsc-col--over{background:var(--dsw-alias-bg-layer-1);border-radius:10px;box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}
.dshsc-colHead{flex:0 0 190px;min-width:0;display:flex;flex-direction:column;gap:6px;padding-top:2px}
.dshsc-colTitle{display:flex;align-items:center;gap:6px;min-width:0}
.dshsc-colName{font-weight:600;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.dshsc-count{color:var(--dsw-alias-label-secondary);font-size:11px;flex:none}
.dshsc-colActions{display:flex;align-items:center;gap:2px}
.dshsc-dot{width:8px;height:8px;border-radius:50%;flex:none;display:inline-block}
.dshsc-colBody{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.dshsc-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;align-content:start}
.dshsc-card{position:relative;min-width:0;min-height:66px;border:0.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);border-radius:8px;padding:8px 9px;cursor:pointer;user-select:none}
.dshsc-card:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2)}
.dshsc-card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dshsc-card--archived{opacity:.62}
.dshsc-card--archived:hover{opacity:.9}
.dshsc-cardTitle{font-size:12.5px;font-weight:600;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
.dshsc-card--archived .dshsc-cardTitle{font-weight:400}
.dshsc-cardMeta{margin-top:4px;color:var(--dsw-alias-label-secondary);font-size:11px;display:flex;gap:5px;align-items:center;overflow:hidden;white-space:nowrap}
.dshsc-cardArchived{flex:none;font-size:10px;line-height:14px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:4px;padding:0 4px}
.dshsc-cardActions{position:absolute;right:3px;bottom:3px;display:flex;gap:0;padding:1px;border-radius:6px;background:var(--dsw-alias-bg-base);opacity:0;transition:opacity .12s}
.dshsc-card:hover .dshsc-cardActions,.dshsc-card:focus-within .dshsc-cardActions{opacity:1}
@media (hover: none) { .dshsc-cardActions { opacity: 1; } }
.dshsc-pager{display:flex;align-items:center;gap:6px;padding:2px 0 0 2px}
.dshsc-pagerLabel{color:var(--dsw-alias-label-secondary);font-size:11px;min-width:64px;text-align:center;font-variant-numeric:tabular-nums}
.dshsc-pagerBtn{appearance:none;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border:0.5px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px;line-height:1;font-family:inherit;padding:0}
.dshsc-pagerBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dshsc-pagerBtn:disabled{opacity:.4;cursor:default}
.dshsc-cardPinned{display:inline-flex;align-items:center;color:var(--dsw-alias-label-secondary);flex:none}
.dshsc-iconBtn{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;padding:0;font-family:inherit}
.dshsc-iconBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dshsc-iconBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dshsc-renameInput{appearance:none;width:100%;box-sizing:border-box;border:0.5px solid var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-base);color:inherit;border-radius:6px;padding:2px 6px;font-size:12.5px;line-height:1.45;font-family:inherit;outline:none}
.dshsc-note{margin-top:6px;color:var(--dsw-alias-state-success-primary);font-size:12px}
.dshsc-empty{color:var(--dsw-alias-label-secondary);font-size:12px;padding:10px 8px;line-height:1.6}
.dshsc-grid > .dshsc-empty{grid-column:1 / -1;padding:8px 2px}
.dshsc-hint{color:var(--dsw-alias-label-secondary);font-size:12px;padding:2px 24px 16px}
.dshsc-input{appearance:none;border:0.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:inherit;border-radius:7px;padding:5px 8px;font-size:12px;font-family:inherit;min-width:140px;outline:none}
.dshsc-input:focus{border-color:var(--dsw-alias-brand-primary)}
.dshsc-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-mask-1);pointer-events:auto}
.dshsc-modal{width:360px;max-width:calc(100vw - 40px);max-height:70vh;overflow:auto;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);border:0.5px solid var(--dsw-alias-border-l2);border-radius:12px;padding:14px;outline:none}
.dshsc-modalTitle{font-size:14px;font-weight:600}
.dshsc-modalHint{margin:4px 0 10px;font-size:12px;color:var(--dsw-alias-label-secondary);word-break:break-word}
.dshsc-opt{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;color:inherit;border-radius:7px;padding:6px 10px;font-size:12.5px;font-family:inherit;cursor:pointer;text-align:left}
.dshsc-opt:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshsc-modalFoot{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.dshsc-row{display:flex;align-items:center;gap:8px}
.dshsc-chip{display:flex;align-items:center;gap:6px;font-size:12px;line-height:16px;color:var(--dsw-alias-hovercard-label-secondary)}
`;

    function emptyState() {
      return { version: 1, categories: [], assignments: {} };
    }

    /** Accept only well-formed stored state; unknown categories are dropped. */
    function normalizeState(raw) {
      const base = emptyState();
      if (raw === null || typeof raw !== 'object') return base;
      const categories = Array.isArray(raw.categories) ? raw.categories : [];
      const seen = new Set();
      for (const entry of categories) {
        if (entry === null || typeof entry !== 'object') continue;
        const id = typeof entry.id === 'string' ? entry.id : undefined;
        const name = typeof entry.name === 'string' ? entry.name.trim() : '';
        if (id === undefined || name === '' || seen.has(id)) continue;
        seen.add(id);
        base.categories.push({
          id,
          name: name.slice(0, 40),
          color: typeof entry.color === 'string' && entry.color !== ''
            ? entry.color
            : COLORS[base.categories.length % COLORS.length],
        });
      }
      const assignments = raw.assignments !== null && typeof raw.assignments === 'object' ? raw.assignments : {};
      for (const [sessionId, categoryId] of Object.entries(assignments)) {
        if (typeof categoryId !== 'string' || !seen.has(categoryId)) continue;
        base.assignments[sessionId] = categoryId;
      }
      return base;
    }

    function loadState() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === null) return emptyState();
        return normalizeState(JSON.parse(raw));
      } catch (error) {
        console.warn('session categories: unreadable stored state', error);
        return emptyState();
      }
    }

    function persistState(state) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch (error) {
        console.warn('session categories: could not persist state', error);
        return false;
      }
    }

    function createStore(initial) {
      let value = initial;
      const listeners = new Set();
      return {
        get: () => value,
        set: (next) => {
          value = next;
          for (const listener of Array.from(listeners)) listener();
        },
        subscribe: (listener) => {
          listeners.add(listener);
          return () => { listeners.delete(listener); };
        },
      };
    }

    function useValue(store) {
      return React.useSyncExternalStore(
        (callback) => store.subscribe(callback),
        () => store.get(),
        () => store.get(),
      );
    }

    /** @param {number} updatedAt */
    function timeLabel(updatedAt) {
      const delta = Math.max(0, Date.now() - updatedAt);
      const minutes = Math.floor(delta / 60000);
      if (minutes < 1) return L.justNow;
      if (minutes < 60) return L.minutesAgo(minutes);
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return L.hoursAgo(hours);
      return L.daysAgo(Math.floor(hours / 24));
    }

    function directoryName(cwd) {
      if (typeof cwd !== 'string' || cwd === '') return '';
      const parts = cwd.split(/[\\/]+/).filter(part => part !== '');
      return parts.length === 0 ? cwd : parts[parts.length - 1];
    }

    function Dot({ color }) {
      return h('span', { className: 'dshsc-dot', style: { background: color } });
    }

    /** One 16px stroked glyph for the card action strip. */
    function Icon({ name, size = 14 }) {
      const children = {
        pin: [
          h('circle', { cx: 8, cy: 5.4, r: 2.6 }),
          h('path', { d: 'M8 8v5.5' }),
        ],
        rename: [
          h('path', { d: 'M3 13l.7-2.6 7.1-7.1 1.9 1.9-7.1 7.1L3 13z' }),
          h('path', { d: 'M9.1 4.4l1.9 1.9' }),
        ],
        archive: [
          h('rect', { x: 2.5, y: 5.5, width: 11, height: 7.5, rx: 1 }),
          h('path', { d: 'M2.5 5.5l1-2.5h9l1 2.5' }),
          h('path', { d: 'M6 8.5h4' }),
        ],
        unarchive: [
          h('rect', { x: 2.5, y: 5.5, width: 11, height: 7.5, rx: 1 }),
          h('path', { d: 'M2.5 5.5l1-2.5h9l1 2.5' }),
          h('path', { d: 'M8 11.6V8.2' }),
          h('path', { d: 'M6.4 9.6L8 8l1.6 1.6' }),
        ],
        tag: [
          h('path', { d: 'M3 3h4.3l5.4 5.4-4.3 4.3L3 7.3V3z' }),
          h('circle', { cx: 5.6, cy: 5.6, r: 0.9, fill: 'currentColor', stroke: 'none' }),
        ],
      }[name];
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round',
        strokeLinejoin: 'round', 'aria-hidden': true, style: { display: 'block' },
      }, children);
    }

    function ActionButton({ icon, label, onClick }) {
      return h('button', {
        type: 'button',
        className: 'dshsc-iconBtn',
        title: label,
        'aria-label': label,
        onClick: (event) => {
          event.stopPropagation();
          onClick();
        },
      }, h(Icon, { name: icon }));
    }

    return {
      inject: ['slots', 'uiWorkspace', 'sessions', 'layout'],
      apply(ctx) {
        const state = createStore(loadState());
        const picker = createStore(null);
        const storage = createStore({ ok: true });
        const notice = createStore(null);
        // Sessions the operator just unarchived here, treated as normal until
        // the Host set agrees (the click must work immediately, as in the sidebar).
        const optimistic = createStore(new Set());
        const uiWorkspace = ctx.get('uiWorkspace');
        const sessions = ctx.get('sessions');
        const layout = ctx.get('layout');
        let noticeTimer = 0;
        const notify = (text) => {
          notice.set({ text, seq: Date.now() });
          clearTimeout(noticeTimer);
          noticeTimer = setTimeout(() => { notice.set(null); }, 6000);
        };
        ctx.effect(() => () => { clearTimeout(noticeTimer); }, 'session categories: notice timer');

        // One shared stylesheet: the menu row and hover chip render outside the
        // board, so the styles cannot live inside a component's own subtree.
        ctx.effect(() => {
          if (typeof document === 'undefined' || document.head === null) return undefined;
          const element = document.createElement('style');
          element.setAttribute('data-dsh-session-groups', '');
          element.textContent = CSS;
          document.head.append(element);
          return () => { element.remove(); };
        }, 'session categories: stylesheet');

        const write = (mutate) => {
          const next = mutate(state.get());
          state.set(next);
          if (!persistState(next) && storage.get().ok) storage.set({ ok: false });
        };

        const addCategory = (name) => {
          const trimmed = typeof name === 'string' ? name.trim().slice(0, 40) : '';
          if (trimmed === '') return undefined;
          const category = {
            id: 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
            name: trimmed,
            color: COLORS[state.get().categories.length % COLORS.length],
          };
          write(current => ({ ...current, categories: [...current.categories, category] }));
          return category;
        };

        const renameCategory = (id, name) => {
          const trimmed = typeof name === 'string' ? name.trim().slice(0, 40) : '';
          if (trimmed === '') return;
          write(current => ({
            ...current,
            categories: current.categories.map(entry => (entry.id === id ? { ...entry, name: trimmed } : entry)),
          }));
        };

        const removeCategory = (id) => {
          write((current) => {
            const assignments = {};
            for (const [sessionId, categoryId] of Object.entries(current.assignments)) {
              if (categoryId !== id) assignments[sessionId] = categoryId;
            }
            return {
              ...current,
              categories: current.categories.filter(entry => entry.id !== id),
              assignments,
            };
          });
        };

        const assign = (sessionId, categoryId) => {
          write((current) => {
            const assignments = { ...current.assignments };
            if (categoryId === null || categoryId === undefined) delete assignments[sessionId];
            else assignments[sessionId] = categoryId;
            return { ...current, assignments };
          });
        };

        const openSession = (sessionId) => {
          try {
            uiWorkspace.openSession(sessionId);
          } catch (error) {
            console.warn('session categories: could not open session', error);
          }
        };

        const categoryOf = (current, sessionId) => {
          const categoryId = current.assignments[sessionId];
          return current.categories.find(entry => entry.id === categoryId);
        };

        const messageOf = (error) => (error instanceof Error && error.message !== ''
          ? error.message
          : String(error));

        /**
         * The Host refusal the shipped archive action turns into a
         * stop-and-archive confirmation. Error classes are not shared across
         * bundles, so the check goes by name.
         */
        const isSessionActiveRefusal = (reason) => reason instanceof Error
          && reason.name === 'WorkspaceArchiveError'
          && reason.rpcError !== undefined
          && reason.rpcError !== null
          && reason.rpcError.code === 'workspace/session-active';

        const renameSession = (session, title) => {
          const trimmed = typeof title === 'string' ? title.trim() : '';
          if (trimmed === '' || trimmed === session.title) return;
          sessions.using(
            session.id,
            { source: 'workspaceOperation' },
            reference => reference.binding.session.rename(trimmed),
          ).then((result) => {
            if (result !== undefined && result !== null && result.ok === false) throw new Error(result.error.message);
          }).catch(error => notify(L.renameFailed + ': ' + messageOf(error)));
        };

        const toggleArchive = (session, onDone) => {
          if (session.archived) {
            const next = new Set(optimistic.get());
            next.add(session.id);
            optimistic.set(next);
            uiWorkspace.unarchiveSession(session.id)
              .then(() => onDone(true))
              .catch((error) => {
                const reverted = new Set(optimistic.get());
                reverted.delete(session.id);
                optimistic.set(reverted);
                notify(L.unarchiveFailed + ': ' + messageOf(error));
              });
            return;
          }
          uiWorkspace.archiveSession(session.id)
            .then(() => onDone(true))
            .catch((reason) => {
              if (!isSessionActiveRefusal(reason)) {
                notify(L.archiveFailed + ': ' + messageOf(reason));
                return;
              }
              if (!window.confirm(L.confirmStopArchive(session.title))) return;
              uiWorkspace.archiveSession(session.id, { stopActivity: true })
                .then(() => onDone(true))
                .catch(error => notify(L.archiveFailed + ': ' + messageOf(error)));
            });
        };

        // The same registry-global pin the sidebar's button drives: the sidebar
        // keeps its own behaviour, and every surface agrees on what is pinned.
        // The board only decides where a pinned card sits inside its group.
        const togglePin = (session) => {
          const action = session.pinned
            ? uiWorkspace.unpinSession(session.id)
            : uiWorkspace.pinSession(session.id);
          action.catch(error => notify((session.pinned ? L.unpinFailed : L.pinFailed) + ': ' + messageOf(error)));
        };

        // ---- row decorations ------------------------------------------------

        function CategoryDot({ sessionId }) {
          const current = useValue(state);
          const category = categoryOf(current, sessionId);
          if (category === undefined) return null;
          return h('span', {
            title: category.name,
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '16px',
              height: '16px',
            },
          }, h(Dot, { color: category.color }));
        }

        function CategoryChip({ sessionId }) {
          const current = useValue(state);
          const category = categoryOf(current, sessionId);
          if (category === undefined) return null;
          return h('span', { className: 'dshsc-chip' },
            h(Dot, { color: category.color }), h('span', null, category.name));
        }

        function SetCategoryMenuItem({ sessionId, displayTitle, useMenuOpenState }) {
          const current = useValue(state);
          const category = categoryOf(current, sessionId);
          const [, setMenuOpen] = useMenuOpenState();
          return h('button', {
            type: 'button',
            role: 'menuitem',
            className: 'dshsc-opt',
            onClick: () => {
              setMenuOpen(false);
              picker.set({ sessionId, displayTitle });
            },
          },
          h('span', { style: { width: '14px', display: 'inline-flex', justifyContent: 'center' } },
            category === undefined ? null : h(Dot, { color: category.color })),
          h('span', { style: { flex: '1' } }, L.setCategory),
          category === undefined
            ? null
            : h('span', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-secondary)' } }, category.name));
        }

        // ---- category picker overlay ---------------------------------------

        function CategoryPicker() {
          const request = useValue(picker);
          const current = useValue(state);
          const [creating, setCreating] = React.useState(false);
          const [draft, setDraft] = React.useState('');
          const modalRef = React.useRef(null);

          React.useEffect(() => {
            if (request === null) return undefined;
            // The dialog portals to the body, so it owns focus while open:
            // Escape dismisses it and focus starts inside rather than behind it.
            if (modalRef.current !== null) modalRef.current.focus();
            const onKey = (event) => {
              if (event.key === 'Escape') picker.set(null);
            };
            window.addEventListener('keydown', onKey);
            return () => { window.removeEventListener('keydown', onKey); };
          }, [request]);

          if (request === null) return null;

          const close = () => {
            picker.set(null);
            setCreating(false);
            setDraft('');
          };

          const option = (key, color, label, selected, onClick) => h('button', {
            key,
            type: 'button',
            className: 'dshsc-opt',
            onClick,
          },
          color === null
            ? h('span', {
              style: {
                width: '10px', display: 'inline-flex', justifyContent: 'center',
                fontSize: '11px', color: 'var(--dsw-alias-label-secondary)',
              },
            }, '—')
            : h(Dot, { color }),
          h('span', { style: { flex: '1' } }, label),
          selected
            ? h('span', { style: { color: 'var(--dsw-alias-brand-primary)', fontSize: '12px' } }, '✓')
            : null);

          const createAndAssign = () => {
            const created = addCategory(draft);
            if (created !== undefined) assign(request.sessionId, created.id);
            close();
          };

          return ReactDOM.createPortal(h('div', {
            className: 'dshsc-backdrop',
            onClick: (event) => { if (event.target === event.currentTarget) close(); },
          },
          h('div', {
            className: 'dshsc-modal',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': 'dshsc-picker-title',
            tabIndex: -1,
            ref: modalRef,
          },
            h('div', { className: 'dshsc-modalTitle', id: 'dshsc-picker-title' }, L.pickTitle),
            h('div', { className: 'dshsc-modalHint' },
              L.pickHint.replace('{name}', displayTitleOf(request))),
            option('none', null, L.clearAssignment, current.assignments[request.sessionId] === undefined,
              () => { assign(request.sessionId, null); close(); }),
            current.categories.map(category => option(
              category.id,
              category.color,
              category.name,
              current.assignments[request.sessionId] === category.id,
              () => { assign(request.sessionId, category.id); close(); },
            )),
            creating
              ? h('div', { className: 'dshsc-row', style: { marginTop: '10px' } },
                h('input', {
                  className: 'dshsc-input',
                  style: { flex: '1', minWidth: '0' },
                  autoFocus: true,
                  value: draft,
                  placeholder: L.newCategoryPlaceholder,
                  onChange: (event) => { setDraft(event.target.value); },
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') createAndAssign();
                  },
                }),
                h('button', { type: 'button', className: 'dshsc-btn dshsc-btn--primary', onClick: createAndAssign }, L.create))
              : current.categories.length === 0
                ? h('div', { className: 'dshsc-empty' }, L.noCategoryYet)
                : null,
            h('div', { className: 'dshsc-modalFoot' },
              creating
                ? null
                : h('button', {
                  type: 'button',
                  className: 'dshsc-btn',
                  onClick: () => { setCreating(true); },
                }, L.addCategory),
              h('button', { type: 'button', className: 'dshsc-btn', onClick: close }, L.close)))),
          document.body);
        }

        // ---- category board -------------------------------------------------

        function SessionCard({ session, color, onOpen, onCategory, onRename, onToggleArchive, onTogglePin, onArchivedClick }) {
          const directory = directoryName(session.cwd);
          const [editing, setEditing] = React.useState(false);
          const [draft, setDraft] = React.useState(session.title);
          const cancelling = React.useRef(false);
          const finished = React.useRef(false);
          const open = () => {
            if (session.archived) {
              onArchivedClick();
              return;
            }
            onOpen(session.id);
          };

          const commitRename = () => {
            if (cancelling.current) {
              cancelling.current = false;
              return;
            }
            if (finished.current) return;
            finished.current = true;
            setEditing(false);
            onRename(session, draft);
          };

          return h('div', {
            className: 'dshsc-card' + (session.archived ? ' dshsc-card--archived' : ''),
            tabIndex: 0,
            title: session.archived ? L.archivedNotOpenable : session.title,
            draggable: true,
            onDragStart: (event) => {
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', session.id);
            },
            onClick: open,
            onKeyDown: (event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              open();
            },
            style: color === null ? undefined : { borderLeft: '2px solid ' + color },
          },
          editing
            ? h('input', {
              className: 'dshsc-renameInput',
              autoFocus: true,
              value: draft,
              'aria-label': L.rename,
              onClick: (event) => { event.stopPropagation(); },
              onChange: (event) => { setDraft(event.target.value); },
              onBlur: commitRename,
              onKeyDown: (event) => {
                event.stopPropagation();
                if (event.key === 'Enter') commitRename();
                if (event.key === 'Escape') {
                  cancelling.current = true;
                  setEditing(false);
                  setDraft(session.title);
                }
              },
            })
            : h('div', { className: 'dshsc-cardTitle' }, session.title),
          h('div', { className: 'dshsc-cardMeta' },
            session.archived ? h('span', { className: 'dshsc-cardArchived' }, L.archivedTag) : null,
            session.pinned && !session.archived
              ? h('span', { className: 'dshsc-cardPinned', title: L.pin }, h(Icon, { name: 'pin', size: 11 }))
              : null,
            directory === '' ? null : h('span', null, directory),
            directory === '' ? null : h('span', null, '·'),
            h('span', null, timeLabel(session.updatedAt))),
          h('div', { className: 'dshsc-cardActions', onClick: (event) => { event.stopPropagation(); } },
            session.archived
              ? null
              : h(ActionButton, {
                icon: 'pin',
                label: session.pinned ? L.unpin : L.pin,
                onClick: () => { onTogglePin(session); },
              }),
            h(ActionButton, {
              icon: 'rename',
              label: L.rename,
              onClick: () => {
                cancelling.current = false;
                finished.current = false;
                setDraft(session.title);
                setEditing(true);
              },
            }),
            h(ActionButton, {
              icon: session.archived ? 'unarchive' : 'archive',
              label: session.archived ? L.unarchive : L.archive,
              onClick: () => { onToggleArchive(session); },
            }),
            h(ActionButton, {
              icon: 'tag',
              label: L.category,
              onClick: () => { onCategory(session); },
            })));
        }

        function CategoryColumn({ column, onOpen, onDropSession, onCategory, onRename, onToggleArchive, onTogglePin, onArchivedClick }) {
          const [over, setOver] = React.useState(false);
          const [editing, setEditing] = React.useState(false);
          const [draft, setDraft] = React.useState(column.name);
          const [page, setPage] = React.useState(0);
          // Escape unmounts the input, whose blur handler would otherwise commit
          // the abandoned draft; the ref lets that one blur pass through.
          const cancelling = React.useRef(false);

          const commitRename = () => {
            if (cancelling.current) {
              cancelling.current = false;
              return;
            }
            setEditing(false);
            if (column.category !== null && draft.trim() !== '' && draft !== column.name) {
              renameCategory(column.category.id, draft);
            }
          };

          const pages = Math.max(1, Math.ceil(column.sessions.length / PAGE_SIZE));
          const safePage = Math.min(page, pages - 1);
          const visibleSessions = column.sessions.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
          React.useEffect(() => {
            if (page > pages - 1) setPage(pages - 1);
          }, [page, pages]);
          // Pinning fronts the Session inside its group, so jump back to the
          // page that now holds it; unpinning leaves the reader where they are
          // and the group simply re-sorts.
          const pinFromGroup = (session) => {
            const wasPinned = session.pinned;
            onTogglePin(session);
            if (!wasPinned) setPage(0);
          };

          return h('section', {
            className: 'dshsc-col' + (over ? ' dshsc-col--over' : ''),
            onDragOver: (event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              if (!over) setOver(true);
            },
            onDragLeave: (event) => {
              if (event.relatedTarget !== null && event.currentTarget.contains(event.relatedTarget)) return;
              setOver(false);
            },
            onDrop: (event) => {
              event.preventDefault();
              setOver(false);
              const sessionId = event.dataTransfer.getData('text/plain');
              if (typeof sessionId !== 'string' || sessionId === '') return;
              onDropSession(sessionId, column.category === null ? null : column.category.id);
            },
          },
          h('header', { className: 'dshsc-colHead' },
            h('div', { className: 'dshsc-colTitle' },
              column.category === null ? null : h(Dot, { color: column.category.color }),
              editing
                ? h('input', {
                  className: 'dshsc-input',
                  style: { minWidth: '0', flex: '1' },
                  autoFocus: true,
                  value: draft,
                  onChange: (event) => { setDraft(event.target.value); },
                  onBlur: commitRename,
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') commitRename();
                    if (event.key === 'Escape') {
                      cancelling.current = true;
                      setEditing(false);
                      setDraft(column.name);
                    }
                  },
                })
                : h('span', { className: 'dshsc-colName', title: column.name }, column.name),
              h('span', { className: 'dshsc-count' }, String(column.sessions.length))),
            h('div', { className: 'dshsc-colActions' },
              column.category === null
                ? null
                : h('button', {
                  type: 'button',
                  className: 'dshsc-btn dshsc-btn--ghost',
                  title: L.rename,
                  onClick: () => {
                    cancelling.current = false;
                    setDraft(column.name);
                    setEditing(true);
                  },
                }, L.rename),
              column.category === null
                ? null
                : h('button', {
                  type: 'button',
                  className: 'dshsc-btn dshsc-btn--ghost',
                  title: L.remove,
                  onClick: () => {
                    if (window.confirm(L.confirmDelete(column.name))) removeCategory(column.category.id);
                  },
                }, L.remove))),
          h('div', { className: 'dshsc-colBody' },
            h('div', { className: 'dshsc-grid' },
              column.sessions.length === 0
                ? h('div', { className: 'dshsc-empty' }, column.category === null ? L.emptyColumn : (over ? L.dropHint : L.emptyColumn))
                : visibleSessions.map(session => h(SessionCard, {
                  key: session.id,
                  session,
                  color: column.category === null ? null : column.category.color,
                  onOpen,
                  onCategory,
                  onRename,
                  onToggleArchive,
                  onTogglePin: pinFromGroup,
                  onArchivedClick,
                }))),
            pages > 1
              ? h('div', { className: 'dshsc-pager' },
                h('button', {
                  type: 'button',
                  className: 'dshsc-pagerBtn',
                  title: L.prevPage,
                  'aria-label': L.prevPage,
                  disabled: safePage === 0,
                  onClick: () => { setPage(Math.max(0, safePage - 1)); },
                }, '‹'),
                h('span', { className: 'dshsc-pagerLabel' }, L.page(safePage + 1, pages)),
                h('button', {
                  type: 'button',
                  className: 'dshsc-pagerBtn',
                  title: L.nextPage,
                  'aria-label': L.nextPage,
                  disabled: safePage >= pages - 1,
                  onClick: () => { setPage(Math.min(pages - 1, safePage + 1)); },
                }, '›'))
              : null));
        }

        const EMPTY_LIST = { ids: [], byId: {}, phase: 'empty' };
        const EMPTY_IDS = [];
        /** Five columns × two rows per group page. */
        const PAGE_SIZE = 10;

        function CategoryBoard(props) {
          // The framework supplies both standard hooks to every root-scoped
          // seat; the fallbacks only keep a headless render from throwing.
          const list = typeof props.useSessions === 'function'
            ? props.useSessions(snapshot => snapshot)
            : EMPTY_LIST;
          // Select the two registry-global sets the way the shipped browser
          // does: field-by-field, so a fresh Host set reaches this board even
          // when the whole-snapshot identity is reused.
          const archivedIds = typeof props.useWorkspaces === 'function'
            ? (props.useWorkspaces(state => state.archivedSessionIds) || EMPTY_IDS)
            : EMPTY_IDS;
          const pinnedIds = typeof props.useWorkspaces === 'function'
            ? (props.useWorkspaces(state => state.pinnedSessionIds) || EMPTY_IDS)
            : EMPTY_IDS;
          const current = useValue(state);
          const optimisticUnarchived = useValue(optimistic);
          const [adding, setAdding] = React.useState(false);
          const [draft, setDraft] = React.useState('');

          const archived = React.useMemo(() => new Set(archivedIds), [archivedIds]);
          const pinned = React.useMemo(() => new Set(pinnedIds), [pinnedIds]);
          // The Host pin set arrives most recently pinned first; that is the
          // order the sidebar uses, and each group follows it locally.
          const pinRank = React.useMemo(
            () => new Map(pinnedIds.map((id, index) => [id, index])),
            [pinnedIds],
          );

          React.useEffect(() => {
            // Drop optimistic entries once the Host set agrees, so a later
            // re-archive of the same Session is not hidden.
            let stale = false;
            for (const id of optimisticUnarchived) {
              if (!archived.has(id)) { stale = true; break; }
            }
            if (!stale) return;
            const next = new Set();
            for (const id of optimisticUnarchived) if (archived.has(id)) next.add(id);
            optimistic.set(next);
          }, [archived, optimisticUnarchived]);

          const sessions = React.useMemo(() => {
            const rows = [];
            const ids = Array.isArray(list.ids) ? list.ids : [];
            for (const id of ids) {
              const summary = list.byId[id];
              if (summary === undefined || summary === null) continue;
              if (summary.origin === 'subagent' || summary.blank === true) continue;
              const isArchived = archived.has(id) && !optimisticUnarchived.has(id);
              rows.push({
                id,
                title: summary.displayTitle || summary.title || id,
                updatedAt: typeof summary.updatedAt === 'number' ? summary.updatedAt : 0,
                cwd: summary.cwd,
                archived: isArchived,
                pinned: pinned.has(id) && !isArchived,
              });
            }
            // Pinned rows lead, most recently pinned first (the Host pin set
            // order); then recency; archived last.
            rows.sort((left, right) => {
              if (left.archived !== right.archived) return left.archived ? 1 : -1;
              if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
              if (left.pinned && right.pinned) {
                return (pinRank.get(left.id) ?? 0) - (pinRank.get(right.id) ?? 0);
              }
              return right.updatedAt - left.updatedAt;
            });
            return rows;
          }, [list, archived, pinned, pinRank, optimisticUnarchived]);

          const columns = React.useMemo(() => {
            const buckets = new Map();
            for (const category of current.categories) buckets.set(category.id, []);
            const loose = [];
            for (const session of sessions) {
              const category = categoryOf(current, session.id);
              if (category === undefined) loose.push(session);
              else (buckets.get(category.id) || loose).push(session);
            }
            return [
              ...current.categories.map(category => ({
                key: category.id,
                name: category.name,
                category,
                sessions: buckets.get(category.id) || [],
              })),
              { key: 'none', name: L.unclassified, category: null, sessions: loose },
            ];
          }, [current, sessions]);

          const submitNewCategory = () => {
            if (addCategory(draft) !== undefined) {
              setDraft('');
              setAdding(false);
            }
          };

          const storageState = useValue(storage);
          const boardRef = React.useRef(null);
          const categoryCount = current.categories.length;
          const previousCount = React.useRef(categoryCount);
          React.useEffect(() => {
            // A new category row lands at the bottom of the vertically
            // scrolling board; without this the user sees no change.
            if (categoryCount > previousCount.current && boardRef.current !== null) {
              boardRef.current.scrollTop = boardRef.current.scrollHeight;
            }
            previousCount.current = categoryCount;
          }, [categoryCount]);

          // A drop carries whatever text the drag source set; only a listed
          // session id may create an assignment.
          const dropSession = (sessionId, categoryId) => {
            if (!sessions.some(session => session.id === sessionId)) return;
            assign(sessionId, categoryId);
          };
          const openPickerFor = (session) => {
            picker.set({ sessionId: session.id, displayTitle: session.title });
          };
          // Archiving the Session that is open clears the main selection, which
          // would replace this board with the Conversation; the board is only
          // mounted while it is the active panel, so re-selecting it is safe.
          const archiveFromBoard = (session) => {
            toggleArchive(session, () => {
              try {
                layout.selectPanel(PANEL_ID);
              } catch (error) {
                console.warn('session categories: could not return to the board', error);
              }
            });
          };
          const noticeState = useValue(notice);
          const archivedCount = sessions.filter(session => session.archived).length;

          return h('div', { className: 'dshsc-page' },
            h('div', { className: 'dshsc-head' },
              h('div', null,
                h('h1', { className: 'dshsc-title' }, L.title),
                h('div', { className: 'dshsc-sub' },
                  L.subtitle + ' · ' + L.total(sessions.length)
                  + (archivedCount === 0 ? '' : ' · ' + L.archivedCount(archivedCount))
                  + ' · ' + L.storageNote),
                storageState.ok ? null : h('div', { className: 'dshsc-warn' }, L.storageFailed),
                noticeState === null
                  ? null
                  : h('div', { className: 'dshsc-warn', key: noticeState.seq }, noticeState.text)),
              h('span', { className: 'dshsc-grow' }),
              adding
                ? h('div', { className: 'dshsc-row' },
                  h('input', {
                    className: 'dshsc-input',
                    autoFocus: true,
                    value: draft,
                    placeholder: L.newCategoryPlaceholder,
                    onChange: (event) => { setDraft(event.target.value); },
                    onKeyDown: (event) => {
                      if (event.key === 'Enter') submitNewCategory();
                      if (event.key === 'Escape') { setDraft(''); setAdding(false); }
                    },
                  }),
                  h('button', { type: 'button', className: 'dshsc-btn dshsc-btn--primary', onClick: submitNewCategory }, L.create),
                  h('button', {
                    type: 'button',
                    className: 'dshsc-btn',
                    onClick: () => { setDraft(''); setAdding(false); },
                  }, L.cancel))
                : h('button', {
                  type: 'button',
                  className: 'dshsc-btn dshsc-btn--primary',
                  onClick: () => { setAdding(true); setDraft(''); },
                }, L.addCategory)),
            current.categories.length === 0
              ? h('div', { className: 'dshsc-hint' }, L.emptyBoard)
              : null,
            h('div', { className: 'dshsc-board', ref: boardRef },
              columns.map(column => h(CategoryColumn, {
                key: column.key,
                column,
                onOpen: openSession,
                onDropSession: dropSession,
                onCategory: openPickerFor,
                onRename: renameSession,
                onToggleArchive: archiveFromBoard,
                onTogglePin: togglePin,
                onArchivedClick: () => notify(L.archivedNotOpenable),
              }))));
        }

        function displayTitleOf(request) {
          const title = request.displayTitle;
          return typeof title === 'string' && title !== '' ? title : request.sessionId;
        }

        function BoardPanelIcon({ size }) {
          return h('svg', {
            width: size,
            height: size,
            viewBox: '0 0 20 20',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.5,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            'aria-hidden': true,
            style: { display: 'block' },
          },
          h('rect', { x: 2.75, y: 3.75, width: 14.5, height: 12.5, rx: 2 }),
          h('path', { d: 'M2.75 8.25h14.5' }),
          h('path', { d: 'M7.5 8.25v8' }));
        }

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, CategoryBoard));

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 240,
          label: L.panelLabel,
        }, BoardPanelIcon));

        ctx.slots.inject('sidebar.session.row.leading', () => ctx.slots.register({
          name: 'sidebar.session.row.leading',
          id: 'session-category-dot',
          order: 40,
        }, CategoryDot));

        ctx.slots.inject('sidebar.session.row.hover', () => ctx.slots.register({
          name: 'sidebar.session.row.hover',
          id: 'session-category-chip',
          order: 40,
        }, CategoryChip));

        ctx.slots.inject('sidebar.workspaces.session.menu.item', () => ctx.slots.register({
          name: 'sidebar.workspaces.session.menu.item',
          id: 'session-category-assign',
          order: 180,
        }, SetCategoryMenuItem));

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'session-category-picker',
          order: 60,
        }, CategoryPicker));
      },
    };
  },
});
