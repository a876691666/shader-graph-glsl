import { RawShaderMaterial } from 'three';
import { SGController } from './SGController';

export class SGMaterial extends RawShaderMaterial {
  sg: SGController;

  constructor() {
    super();
    this.sg = new SGController(this);
    this.vertexShader = '';
    this.fragmentShader = '';
  }
}
