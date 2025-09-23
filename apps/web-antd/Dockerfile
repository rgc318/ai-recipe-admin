# ./apps/web-antd/Dockerfile

# --- 阶段一：依赖安装 (Dependencies) ---
# 这个阶段的目标是只做一件事：高效且可缓存地安装所有依赖
FROM node:20-slim AS deps

# Alpine 镜像非常精简，我们需要手动安装 git，因为某些 Vite 插件需要它
RUN apt-get update && apt-get install -y git

WORKDIR /app

# 1. 复制所有构建依赖所需的文件
# 这样，只要这些文件不改变，Docker 就会使用缓存，无需重新安装 pnpm install
COPY pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
# 为了让 pnpm workspaces 正确解析依赖关系，我们需要所有子项目的 package.json
COPY apps/web-antd/package.json ./apps/web-antd/
# 同样复制所有可能被 web-antd 依赖的 packages
COPY packages/ /app/packages/

# 2. 启用 corepack 并安装所有依赖
# 使用 --frozen-lockfile 确保CI环境中使用确切的依赖版本
RUN npm i -g corepack && corepack enable && pnpm install


# --- 阶段二：构建项目 (Builder) ---
# 这个阶段利用上一个阶段已经安装好的依赖来构建应用
FROM node:20-slim AS builder

WORKDIR /app

# 1. 复制所有源代码
COPY . .

# 2. 从 'deps' 阶段复制已经安装好的 node_modules
# 这样做的好处是，当只有源代码变动时，可以利用 'deps' 阶段的缓存，跳过 pnpm install
COPY --from=deps /app/node_modules ./node_modules

RUN corepack enable

# 设置构建时环境变量
ARG VITE_BASE=/
ENV VITE_BASE=${VITE_BASE}
ENV NODE_ENV=production

# 3. 执行我们验证成功的构建命令
# - 使用 pnpm 来调用项目内的 turbo
# - 使用 --filter=@vben/web-antd... 来确保只构建目标应用及其内部依赖
RUN pnpm turbo run build --filter=@vben/web-antd...


# --- 阶段三：生产环境 (Production) ---
# 这个阶段只包含最终的产物和一个轻量级服务器，做到最小、最安全
FROM nginx:stable-alpine AS production

# 复制 web-antd 的构建产物
COPY --from=builder /app/apps/web-antd/dist /usr/share/nginx/html

# 复制 nginx 配置文件
# 假设 nginx.conf 文件位于 apps/web-antd/ 目录下
COPY --from=builder /app/apps/web-antd/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
