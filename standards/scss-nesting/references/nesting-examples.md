# SCSS 嵌套规范 — 示例

**Good**

```scss
.user-card {
  padding: 16px;

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }

  .info {
    margin-left: 12px;

    .name {
      font-size: 16px;
      font-weight: 600;
    }

    .bio {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }

  .actions {
    display: flex;
    gap: 8px;

    .btn {
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }

      &--primary {
        background: var(--color-fg);
        color: var(--color-bg);
      }
    }
  }
}
```

**Bad**

```scss
/* 平铺写法，没有嵌套 */
.user-card {
  padding: 16px;
}
.user-card .avatar {
  width: 48px;
}
.user-card .info .name {
  font-size: 16px;
}

/* 多个顶层类名 */
.user-card {
  padding: 16px;
}
.avatar {
  width: 48px;
}
.actions {
  display: flex;
}
```
