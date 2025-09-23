# ./apps/web-antd/Dockerfile

# --- 阶段一：构建环境 (Builder) ---
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

# 关键修改：在 pnpm install 之前，复制所有相关的 package.json 文件和工作区定义文件
# 这能让 pnpm 完整地理解整个 Monorepo 的依赖结构
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# 根据您的项目结构，将所有子项目的 package.json 也复制进来
# 示例：
COPY apps/web-antd/package.json ./apps/web-antd/
COPY apps/web-ele/package.json ./apps/web-ele/
COPY packages/components/package.json ./packages/components/

# 在仓库根目录的上下文中，安装所有依赖
RUN pnpm install

# 复制整个项目的所有源代码
COPY . .

# 关键：在完整的环境中，只构建我们需要的 web-antd 子项目
RUN pnpm --filter web-antd build


# --- 阶段二：生产环境 (Production) ---
FROM nginx:alpine

# 从构建器阶段，只复制 web-antd 打包好的 dist 目录
COPY --from=builder /app/apps/web-antd/dist /usr/share/nginx/html

# 复制 Nginx 配置文件
COPY apps/web-antd/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
