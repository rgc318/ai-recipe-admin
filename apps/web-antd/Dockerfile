# ./apps/web-antd/Dockerfile

# --- 阶段一：依赖安装 (Dependencies) ---
# 单独创建一个阶段来处理依赖，以便更好地利用缓存
FROM node:20-alpine AS deps

WORKDIR /app

# 1. 只复制构建依赖所需的文件
# 这样，只要这些文件不改变，Docker 就会使用缓存，无需重新安装
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# 如果有其他根目录的配置文件，也一并复制，例如：
# COPY turbo.json tsconfig.json ./

# 2. 启用 corepack 并安装所有依赖
# 使用 --frozen-lockfile 确保CI环境中使用确切的依赖版本
RUN npm i -g corepack && pnpm install --frozen-lockfile


# --- 阶段二：构建项目 (Builder) ---
# 这个阶段利用上一个阶段已经安装好的依赖
FROM node:20-alpine AS builder

WORKDIR /app

# 1. 从 'deps' 阶段复制已经安装好的 node_modules
COPY --from=deps /app/node_modules ./node_modules
# 2. 复制所有源代码
# 因为依赖已经安装好了，代码的变动不会影响到依赖缓存层
COPY . .


# 设置构建时环境变量
ARG VITE_BASE=/
ENV VITE_BASE=${VITE_BASE}
ENV NODE_ENV=production

# 3. 只需要执行一次构建命令
# pnpm 会自动构建目标应用(web-antd)及其所有内部依赖
RUN pnpm --filter web-antd build


# --- 阶段三：生产环境 (Production) ---
FROM nginx:alpine AS production

# 复制 web-antd 的构建产物
COPY --from=builder /app/apps/web-antd/dist /usr/share/nginx/html

# 复制 nginx 配置文件
COPY apps/web-antd/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

