var u=Object.defineProperty;var l=(n,i,o)=>i in n?u(n,i,{enumerable:!0,configurable:!0,writable:!0,value:o}):n[i]=o;var e=(n,i,o)=>(l(n,typeof i!="symbol"?i+"":i,o),o);import"./web-ifc-api-B0Sf851n.js";import{S as h}from"./serializer-Bsk2S661.js";import{c,E as a}from"./index-nph87nXj.js";const d=class d extends c{constructor(o){super(o);e(this,"onDisposed",new a);e(this,"onFragmentsLoaded",new a);e(this,"onFragmentsDisposed",new a);e(this,"list",new Map);e(this,"groups",new Map);e(this,"enabled",!0);e(this,"baseCoordinationModel","");e(this,"_loader",new h);this.components.add(d.uuid,this)}get meshes(){const o=[];for(const[r,t]of this.list)o.push(t.mesh);return o}dispose(){for(const[o,r]of this.groups)r.dispose(!0);this.baseCoordinationModel="",this.groups.clear(),this.list.clear(),this.onFragmentsLoaded.reset(),this.onFragmentsDisposed.reset(),this.onDisposed.trigger(),this.onDisposed.reset()}disposeGroup(o){const{uuid:r}=o,t=[];for(const s of o.items)t.push(s.id),this.list.delete(s.id);o.dispose(!0),this.groups.delete(o.uuid),this.onFragmentsDisposed.trigger({groupID:r,fragmentIDs:t})}load(o,r=!0){const t=this._loader.import(o);for(const s of t.items)s.group=t,this.list.set(s.id,s);return r&&this.coordinate([t]),this.groups.set(t.uuid,t),this.onFragmentsLoaded.trigger(t),t}export(o){return this._loader.export(o)}coordinate(o=Array.from(this.groups.values())){if(this.baseCoordinationModel.length===0){const s=o.pop();if(!s)return;this.baseCoordinationModel=s.uuid}if(!o.length)return;const t=this.groups.get(this.baseCoordinationModel);if(!t){console.log("No base model found for coordination!");return}for(const s of o)s!==t&&(s.position.set(0,0,0),s.rotation.set(0,0,0),s.scale.set(1,1,1),s.updateMatrix(),s.applyMatrix4(s.coordinationMatrix.clone().invert()),s.applyMatrix4(t.coordinationMatrix))}};e(d,"uuid","fef46874-46a3-461b-8c44-2922ab77c806");let p=d;export{p as F};
