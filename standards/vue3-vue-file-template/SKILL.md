---
name: vue3-vue-file-template
description: 当在 Vue3 项目中新建 .vue 文件时，自动生成标准的单文件组件基础结构，并根据项目是否使用 TypeScript 决定是否添加 lang="ts"
---

# Vue3 单文件组件模板 Skill

该 Skill 用于在 Vue3 项目中创建 `.vue` 文件时，自动生成统一的组件基础骨架结构，确保项目中的组件文件结构规范一致。

生成的默认结构包含：

<script setup></script>

<template></template>

<style scoped lang="scss"></style>

如果当前项目使用 TypeScript，则 `<script setup>` 需要自动变为：

<script setup lang="ts"></script>

## 何时使用

在以下场景使用该 Skill：

* 用户在 Vue3 项目中创建新的 `.vue` 组件文件
* 需要为组件快速生成标准化基础模板
* 需要保证团队项目中的 Vue 单文件组件结构一致
* 需要根据项目是否使用 TypeScript 自动调整 `<script>` 标签配置

该 Skill 适用于所有 Vue3 单文件组件（SFC）创建场景。

## 生成结构规则

创建 `.vue` 文件时，必须生成如下结构顺序：

1. `<script setup>`
2. `<template>`
3. `<style scoped lang="scss">`

基础模板如下：

<script setup></script>

<template>
</template>

<style scoped lang="scss"></style>

## TypeScript 判断规则

在生成模板前，需要判断当前项目是否启用了 TypeScript。

判断方式：

1. 检查项目根目录是否存在 `tsconfig.json`
2. 如果存在，则认为项目启用了 TypeScript
3. 如果不存在，则认为项目使用 JavaScript

当项目启用 TypeScript 时，模板必须调整为：

<script setup lang="ts"></script>

<template>
</template>

<style scoped lang="scss"></style>

## 约定规范

生成模板时需要遵循以下规范：

* `<script setup>` 必须放在文件最顶部
* `<template>` 放在 `<script>` 之后
* `<style>` 必须使用 `scoped`
* `<style>` 默认使用 `scss`
* 标签之间保留一个空行，保持代码可读性

## 最终目标

确保 Vue3 项目中新建 `.vue` 文件时：

* 结构统一
* 代码整洁
* 自动适配 TypeScript 或 JavaScript 项目
* 减少重复手动编写模板的操作


