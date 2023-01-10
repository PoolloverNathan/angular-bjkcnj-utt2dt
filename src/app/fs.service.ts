import { Injectable } from "@angular/core"
import http from "isomorphic-git/http/web"
import git from "isomorphic-git"
// import { get, set } from 'idb-keyval'
import { install as installBfs, configure as configureBfs } from "browserfs"

@Injectable({
  providedIn: "root",
})
export class FsService {
  constructor() {
    installBfs(this.bfsGlobal)
    this.fs = this.bfsGlobal.require("fs")
  }
  handle?: FileSystemDirectoryHandle
  hasTriedLoadingFromIdb = true
  bfsGlobal = {} as any
  get canAskUser() {
    return !this.handle && this.hasTriedLoadingFromIdb
  }
  async isAvailable() {
    if (!this.handle) return false
    if ("granted" !== this.handle.queryPermission({ mode: "readwrite" })) {
      this.handle = undefined
      return false
    }
    return true
  }
  async requestHandle() {
    if (await this.isAvailable()) return
  }
  async requestPermission() {
    if (
      "granted" !==
      (await this.handle?.queryPermission?.({ mode: "readwrite" }))
    ) {
      if (
        "granted" !==
        (await this.handle?.requestPermission?.({ mode: "readwrite" }))
      ) {
        this.handle = undefined
        return false
      }
    }
    return true
  }
  // async loadFromIdb() {
  //   const handle = await get("dir")
  //   this.handle = handle
  //   if (handle) this.requestPermission()
  //   this.hasTriedLoadingFromIdb = true
  // }
  async getBrowserFs() {
    if (!(await this.isAvailable())) throw new Error("FsService not available")
  }
  http = http
  git = git
  fs: typeof import("fs")
  // HORRIBLE HACK WARNING MADE WORSE BY FORMATTER, AVERT EYES
  //#region
  get gitProps() {
    return Object.setPrototypeOf(
      (keys: object) => ({ ...this.gitProps, ...keys }),
      { http: this.http, fs: this.fs }
    ) as {
      http: FsService["http"]
      fs: FsService["fs"]
      <T extends object>(keys: T): Omit<
        {
          http: FsService["http"]
          fs: FsService["fs"]
        },
        keyof T
      > &
        T
    }
  }
  //#endregion
}
