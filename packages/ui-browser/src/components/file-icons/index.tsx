import { File as GenericFile } from "lucide-react";
import type { IconKey } from "@/lib/file-icon";
import css from "./svg/css.svg";
import docker from "./svg/docker.svg";
import env from "./svg/env.svg";
import font from "./svg/font.svg";
import git from "./svg/git.svg";
import go from "./svg/go.svg";
import html from "./svg/html.svg";
import image from "./svg/image.svg";
import java from "./svg/java.svg";
import javascript from "./svg/javascript.svg";
import json from "./svg/json.svg";
import lock from "./svg/lock.svg";
import markdown from "./svg/markdown.svg";
import npm from "./svg/npm.svg";
import python from "./svg/python.svg";
import react from "./svg/react.svg";
import rust from "./svg/rust.svg";
import shell from "./svg/shell.svg";
import sql from "./svg/sql.svg";
import svg from "./svg/svg.svg";
import text from "./svg/text.svg";
import toml from "./svg/toml.svg";
import typescript from "./svg/typescript.svg";
import yaml from "./svg/yaml.svg";

const URLS: Partial<Record<IconKey, string>> = {
  css, docker, env, font, git, go, html, image, java, javascript, json,
  lock, markdown, npm, python, react, rust, shell, sql, svg, text, toml,
  typescript, yaml,
};

export const FileTypeIcon = ({
  icon,
  className,
}: {
  icon: IconKey;
  className?: string;
}) => {
  const url = URLS[icon];
  if (!url) return <GenericFile className={className} />;
  return <img src={url} className={className} alt="" />;
};
