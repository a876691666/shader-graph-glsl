import { BufferGeometry, Texture } from 'three';

/**
 * 清理 Geometry 的 GPU 资源 (WebGL2 下为 Three.js 自动管理，此处保留接口兼容)
 */
export function disposeGeometry(geometry: BufferGeometry) {
  geometry.dispose();
}

/**
 * 清理 Material 的 GPU 资源
 */
export function disposeMaterial(material: { dispose?: () => void }) {
  material.dispose?.();
}

/**
 * 清理 Texture 的 GPU 资源
 */
export function disposeTexture(texture: Texture) {
  if (texture.image) {
    if ((texture.image as any)?.src) (texture.image as any).src = '';
    texture.image = null;
  }
  if (texture.mipmaps?.length) texture.mipmaps.length = 0;
  texture.dispose();
}
