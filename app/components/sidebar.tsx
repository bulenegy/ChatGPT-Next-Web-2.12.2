import { useEffect, useRef, useMemo } from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
import DragIcon from "../icons/drag.svg";

import Locale from "../locales";

// a5470 新增图标登录、微信、帮助（问号）
import LoginIcon from "../icons/login.svg";
import HelpIcon from "../icons/help.svg";
import WechatIcon from "../icons/wechat.svg";

import { useAppConfig, useChatStore } from "../store";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
  CONTACT_URL,
  HELP_URL, //a5470 新增的联系客服链接
} from "../constant";

import { Link, useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { showConfirm, showToast } from "./ui-lib";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

export function SideBar(props: { className?: string }) {
  const chatStore = useChatStore();

  // drag side bar
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );

  //a5470 网页传递地址参数功能
  // 新增的处理函数，用于设置地址参数并导航到 web.tsx
  const handleOpenWeb = (url:string, main_title:string, submai_title:string) => {
    navigate(`/web/${encodeURIComponent(url)}/${encodeURIComponent(main_title)}/${encodeURIComponent(submai_title)}`);
  };
  //结束

  useHotKey();

  return (
    <div
      className={`${styles.sidebar} ${props.className} ${
        shouldNarrow && styles["narrow-sidebar"]
      }`}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      {/* a5470 首页标题、副标题、Logo */}
      <div className={styles["sidebar-header"]} data-tauri-drag-region>
        <div className={styles["sidebar-title"]} data-tauri-drag-region>
          ChatGPT
        </div>
        <div className={styles["sidebar-sub-title"]}>
          Your AI assistant.
        </div>
        <div className={styles["sidebar-logo"] + " no-dark"}>
          <ChatGptIcon />
        </div>
      </div>

      <div className={styles["sidebar-header-bar"]}>
        {/* a5470 首页原面具功能 */}
        {/* <IconButton
          icon={<MaskIcon />}
          text={shouldNarrow ? undefined : Locale.Mask.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => {
            if (config.dontShowMaskSplashScreen !== true) {
              navigate(Path.NewChat, { state: { fromHome: true } });
            } else {
              navigate(Path.Masks, { state: { fromHome: true } });
            }
          }}
          shadow
        /> */}

        {/* a5470 首页插件功能 */}
        {/* <IconButton
          icon={<PluginIcon />}
          text={shouldNarrow ? undefined : Locale.Plugin.Name}
          className={styles["sidebar-bar-button"]}
          onClick={() => showToast(Locale.WIP)}
          shadow
        /> */}
        <IconButton
        //a5470 原来是面具启动页，现在调整为接入启动
          icon={<LoginIcon />}
          text="登录"
          className={styles["sidebar-bar-button"]}
          // onClick={() => navigate(Path.NewChat, { state: { fromHome: true } })}
          // onClick={() => navigate(Path.Auth, { state: { fromHome: true } })}

          onClick={() => navigate(Path.Login  , { state: { fromHome: true } }) }
          shadow
        />
        <IconButton
          icon={<WechatIcon />}
          text="联系客服"
          // text={shouldNarrow ? undefined : Locale.Plugin.Name}
          className={styles["sidebar-bar-button"]}
          
          // a5470 联系客服跳转
          // onClick={() => showToast(Locale.WIP)}
          // onClick={() => window.open(LEARN_URL, '_blank')} 
          // onClick={() => window.open(CONTACT_URL, '_blank')} 
          onClick={() => handleOpenWeb(CONTACT_URL, '联系客服', '联系客服')}
          shadow
        />
      </div>

      <div
        className={styles["sidebar-body"]}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate(Path.Home);
          }
        }}
      >
        <ChatList narrow={shouldNarrow} />
      </div>

      <div className={styles["sidebar-tail"]}>
        <div className={styles["sidebar-actions"]}>
          <div className={styles["sidebar-action"] + " " + styles.mobile}>
            {/* a5470 首页删除对话记录功能，仅移动网页有 */}
            <IconButton
              icon={<DeleteIcon />}
              onClick={async () => {
                if (await showConfirm(Locale.Home.DeleteChat)) {
                  chatStore.deleteSession(chatStore.currentSessionIndex);
                }
              }}
            />
          </div>
          <div className={styles["sidebar-action"]}>
            {/* a5470 首页设置按钮功能 */}
            <Link to={Path.Settings}>
              <IconButton icon={<SettingsIcon />} shadow />
            </Link>
          </div>
          <div className={styles["sidebar-action"]}>
            {/* a5470 原版github链接 */}
            {/* <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <IconButton icon={<GithubIcon />} shadow /> */}
            {/* a5470 修改后 帮助链接 */}
              <a href={HELP_URL} target="_blank" rel="noopener noreferrer">
              <IconButton icon={<HelpIcon />} shadow />
            </a>
          </div>
        </div>
        <div>
          {/* a5470 首页新的聊天功能 */}
          <IconButton
            icon={<AddIcon />}
            text={shouldNarrow ? undefined : Locale.Home.NewChat}
            onClick={() => {
              if (config.dontShowMaskSplashScreen) {
                chatStore.newSession();
                navigate(Path.Chat);
              } else {
                navigate(Path.NewChat);
              }
            }}
            shadow
          />
        </div>
      </div>

      <div
        className={styles["sidebar-drag"]}
        onPointerDown={(e) => onDragStart(e as any)}
      >
        <DragIcon />
      </div>
    </div>
  );
}
