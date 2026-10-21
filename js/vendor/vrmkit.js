(()=>{var l=window.THREE;var ka=l.ACESFilmicToneMapping,Ga=l.AddEquation,Wa=l.AddOperation,za=l.AdditiveAnimationBlendMode,ja=l.AdditiveBlending,Xa=l.AlphaFormat,qa=l.AlwaysCompare,Qa=l.AlwaysDepth,Ya=l.AlwaysStencilFunc,Ka=l.AmbientLight,Za=l.AnimationAction,Kn=l.AnimationClip,$a=l.AnimationLoader,Ja=l.AnimationMixer,el=l.AnimationObjectGroup,tl=l.AnimationUtils,nl=l.ArcCurve,rl=l.ArrayCamera,il=l.ArrowHelper,ol=l.AttachedBindMode,sl=l.Audio,al=l.AudioAnalyser,ll=l.AudioContext,ul=l.AudioListener,cl=l.AudioLoader,Zn=l.AxesHelper,$n=l.BackSide,dl=l.BasicDepthPacking,hl=l.BasicShadowMap,Jn=l.Bone,pl=l.BooleanKeyframeTrack,fl=l.Box2,er=l.Box3,ml=l.Box3Helper,gl=l.BoxGeometry,_l=l.BoxHelper,I=l.BufferAttribute,U=l.BufferGeometry,xl=l.BufferGeometryLoader,Tl=l.ByteType,vl=l.Cache,El=l.Camera,Ml=l.CameraHelper,Rl=l.CanvasTexture,Al=l.CapsuleGeometry,yl=l.CatmullRomCurve3,Sl=l.CineonToneMapping,wl=l.CircleGeometry,tr=l.ClampToEdgeWrapping,Ll=l.Clock,O=l.Color,bl=l.ColorKeyframeTrack,dt=l.ColorManagement,Pl=l.CompressedArrayTexture,Cl=l.CompressedCubeTexture,Il=l.CompressedTexture,Hl=l.CompressedTextureLoader,Nl=l.ConeGeometry,Bl=l.ConstantAlphaFactor,Ol=l.ConstantColorFactor,Ul=l.CubeCamera,Dl=l.CubeReflectionMapping,Fl=l.CubeRefractionMapping,Vl=l.CubeTexture,kl=l.CubeTextureLoader,Gl=l.CubeUVReflectionMapping,Wl=l.CubicBezierCurve,zl=l.CubicBezierCurve3,jl=l.CubicInterpolant,Xl=l.CullFaceBack,ql=l.CullFaceFront,Ql=l.CullFaceFrontBack,Yl=l.CullFaceNone,Kl=l.Curve,Zl=l.CurvePath,$l=l.CustomBlending,Jl=l.CustomToneMapping,eu=l.CylinderGeometry,tu=l.Cylindrical,nu=l.Data3DTexture,ru=l.DataArrayTexture,iu=l.DataTexture,ou=l.DataTextureLoader,su=l.DataUtils,au=l.DecrementStencilOp,lu=l.DecrementWrapStencilOp,uu=l.DefaultLoadingManager,cu=l.DepthFormat,du=l.DepthStencilFormat,hu=l.DepthTexture,pu=l.DetachedBindMode,nr=l.DirectionalLight,fu=l.DirectionalLightHelper,mu=l.DiscreteInterpolant,gu=l.DisplayP3ColorSpace,_u=l.DodecahedronGeometry,Ce=l.DoubleSide,xu=l.DstAlphaFactor,Tu=l.DstColorFactor,vu=l.DynamicCopyUsage,rr=l.DynamicDrawUsage,Eu=l.DynamicReadUsage,Mu=l.EdgesGeometry,Ru=l.EllipseCurve,Au=l.EqualCompare,yu=l.EqualDepth,Su=l.EqualStencilFunc,wu=l.EquirectangularReflectionMapping,Lu=l.EquirectangularRefractionMapping,Ie=l.Euler,bu=l.EventDispatcher,Pu=l.ExtrudeGeometry,ht=l.FileLoader,Cu=l.Float16BufferAttribute,_o=l.Float32BufferAttribute,Iu=l.Float64BufferAttribute,Hu=l.FloatType,Nu=l.Fog,Bu=l.FogExp2,Ou=l.FramebufferTexture,ir=l.FrontSide,Uu=l.Frustum,pt=l.GLBufferAttribute,Du=l.GLSL1,Fu=l.GLSL3,Vu=l.GreaterCompare,ku=l.GreaterDepth,Gu=l.GreaterEqualCompare,Wu=l.GreaterEqualDepth,zu=l.GreaterEqualStencilFunc,ju=l.GreaterStencilFunc,Xu=l.GridHelper,V=l.Group,qu=l.HalfFloatType,Qu=l.HemisphereLight,Yu=l.HemisphereLightHelper,Ku=l.IcosahedronGeometry,or=l.ImageBitmapLoader,sr=l.ImageLoader,Zu=l.ImageUtils,$u=l.IncrementStencilOp,Ju=l.IncrementWrapStencilOp,ft=l.InstancedBufferAttribute,ec=l.InstancedBufferGeometry,tc=l.InstancedInterleavedBuffer,ar=l.InstancedMesh,nc=l.Int16BufferAttribute,rc=l.Int32BufferAttribute,ic=l.Int8BufferAttribute,oc=l.IntType,_e=l.InterleavedBuffer,xe=l.InterleavedBufferAttribute,lr=l.Interpolant,ur=l.InterpolateDiscrete,mt=l.InterpolateLinear,sc=l.InterpolateSmooth,ac=l.InvertStencilOp,lc=l.KeepStencilOp,uc=l.KeyframeTrack,cc=l.LOD,dc=l.LatheGeometry,hc=l.Layers,pc=l.LessCompare,fc=l.LessDepth,mc=l.LessEqualCompare,gc=l.LessEqualDepth,_c=l.LessEqualStencilFunc,xc=l.LessStencilFunc,Tc=l.Light,vc=l.LightProbe,je=l.Line,Ec=l.Line3,X=l.LineBasicMaterial,Mc=l.LineCurve,Rc=l.LineCurve3,Ac=l.LineDashedMaterial,cr=l.LineLoop,re=l.LineSegments,yc=l.LinearDisplayP3ColorSpace,Sc=l.LinearEncoding,gt=l.LinearFilter,wc=l.LinearInterpolant,Lc=l.LinearMipMapLinearFilter,bc=l.LinearMipMapNearestFilter,_t=l.LinearMipmapLinearFilter,dr=l.LinearMipmapNearestFilter,J=l.LinearSRGBColorSpace,Pc=l.LinearToneMapping,Cc=l.LinearTransfer,hr=l.Loader,Xe=l.LoaderUtils,Ic=l.LoadingManager,Hc=l.LoopOnce,Nc=l.LoopPingPong,Bc=l.LoopRepeat,Oc=l.LuminanceAlphaFormat,Uc=l.LuminanceFormat,Dc=l.MOUSE,Te=l.Material,Fc=l.MaterialLoader,N=l.MathUtils,G=l.Matrix3,D=l.Matrix4,Vc=l.MaxEquation,He=l.Mesh,ee=l.MeshBasicMaterial,kc=l.MeshDepthMaterial,Gc=l.MeshDistanceMaterial,Wc=l.MeshLambertMaterial,zc=l.MeshMatcapMaterial,jc=l.MeshNormalMaterial,Xc=l.MeshPhongMaterial,te=l.MeshPhysicalMaterial,xt=l.MeshStandardMaterial,qc=l.MeshToonMaterial,Qc=l.MinEquation,pr=l.MirroredRepeatWrapping,Yc=l.MixOperation,Kc=l.MultiplyBlending,Zc=l.MultiplyOperation,fr=l.NearestFilter,$c=l.NearestMipMapLinearFilter,Jc=l.NearestMipMapNearestFilter,mr=l.NearestMipmapLinearFilter,gr=l.NearestMipmapNearestFilter,ed=l.NeverCompare,td=l.NeverDepth,nd=l.NeverStencilFunc,rd=l.NoBlending,id=l.NoColorSpace,od=l.NoToneMapping,sd=l.NormalAnimationBlendMode,ad=l.NormalBlending,ld=l.NotEqualCompare,ud=l.NotEqualDepth,cd=l.NotEqualStencilFunc,Tt=l.NumberKeyframeTrack,q=l.Object3D,dd=l.ObjectLoader,hd=l.ObjectSpaceNormalMap,pd=l.OctahedronGeometry,fd=l.OneFactor,md=l.OneMinusConstantAlphaFactor,gd=l.OneMinusConstantColorFactor,_d=l.OneMinusDstAlphaFactor,xd=l.OneMinusDstColorFactor,Td=l.OneMinusSrcAlphaFactor,vd=l.OneMinusSrcColorFactor,_r=l.OrthographicCamera,Ed=l.P3Primaries,Md=l.PCFShadowMap,Rd=l.PCFSoftShadowMap,Ad=l.PMREMGenerator,yd=l.Path,xr=l.PerspectiveCamera,Sd=l.Plane,wd=l.PlaneGeometry,Ld=l.PlaneHelper,Tr=l.PointLight,bd=l.PointLightHelper,vr=l.Points,Er=l.PointsMaterial,Pd=l.PolarGridHelper,Cd=l.PolyhedronGeometry,Id=l.PositionalAudio,Mr=l.PropertyBinding,Hd=l.PropertyMixer,Nd=l.QuadraticBezierCurve,Bd=l.QuadraticBezierCurve3,S=l.Quaternion,vt=l.QuaternionKeyframeTrack,Od=l.QuaternionLinearInterpolant,Ud=l.RED_GREEN_RGTC2_Format,Dd=l.RED_RGTC1_Format,ce=l.REVISION,Fd=l.RGBADepthPacking,Vd=l.RGBAFormat,kd=l.RGBAIntegerFormat,Gd=l.RGBA_ASTC_10x10_Format,Wd=l.RGBA_ASTC_10x5_Format,zd=l.RGBA_ASTC_10x6_Format,jd=l.RGBA_ASTC_10x8_Format,Xd=l.RGBA_ASTC_12x10_Format,qd=l.RGBA_ASTC_12x12_Format,Qd=l.RGBA_ASTC_4x4_Format,Yd=l.RGBA_ASTC_5x4_Format,Kd=l.RGBA_ASTC_5x5_Format,Zd=l.RGBA_ASTC_6x5_Format,$d=l.RGBA_ASTC_6x6_Format,Jd=l.RGBA_ASTC_8x5_Format,eh=l.RGBA_ASTC_8x6_Format,th=l.RGBA_ASTC_8x8_Format,nh=l.RGBA_BPTC_Format,rh=l.RGBA_ETC2_EAC_Format,ih=l.RGBA_PVRTC_2BPPV1_Format,oh=l.RGBA_PVRTC_4BPPV1_Format,sh=l.RGBA_S3TC_DXT1_Format,ah=l.RGBA_S3TC_DXT3_Format,lh=l.RGBA_S3TC_DXT5_Format,uh=l.RGB_BPTC_SIGNED_Format,ch=l.RGB_BPTC_UNSIGNED_Format,dh=l.RGB_ETC1_Format,hh=l.RGB_ETC2_Format,ph=l.RGB_PVRTC_2BPPV1_Format,fh=l.RGB_PVRTC_4BPPV1_Format,mh=l.RGB_S3TC_DXT1_Format,gh=l.RGFormat,_h=l.RGIntegerFormat,xh=l.RawShaderMaterial,Th=l.Ray,vh=l.Raycaster,Eh=l.Rec709Primaries,Mh=l.RectAreaLight,Rh=l.RedFormat,Ah=l.RedIntegerFormat,yh=l.ReinhardToneMapping,Sh=l.RenderTarget,qe=l.RepeatWrapping,wh=l.ReplaceStencilOp,Lh=l.ReverseSubtractEquation,bh=l.RingGeometry,Ph=l.SIGNED_RED_GREEN_RGTC2_Format,Ch=l.SIGNED_RED_RGTC1_Format,ve=l.SRGBColorSpace,Ih=l.SRGBTransfer,Hh=l.Scene,Nh=l.ShaderChunk,Bh=l.ShaderLib,Rr=l.ShaderMaterial,Oh=l.ShadowMaterial,Uh=l.Shape,Dh=l.ShapeGeometry,Fh=l.ShapePath,Vh=l.ShapeUtils,kh=l.ShortType,ie=l.Skeleton,Gh=l.SkeletonHelper,Qe=l.SkinnedMesh,Wh=l.Source,Ar=l.Sphere,zh=l.SphereGeometry,jh=l.Spherical,Xh=l.SphericalHarmonics3,qh=l.SplineCurve,yr=l.SpotLight,Qh=l.SpotLightHelper,Yh=l.Sprite,Kh=l.SpriteMaterial,Zh=l.SrcAlphaFactor,$h=l.SrcAlphaSaturateFactor,Jh=l.SrcColorFactor,ep=l.StaticCopyUsage,tp=l.StaticDrawUsage,np=l.StaticReadUsage,rp=l.StereoCamera,ip=l.StreamCopyUsage,op=l.StreamDrawUsage,sp=l.StreamReadUsage,ap=l.StringKeyframeTrack,lp=l.SubtractEquation,up=l.SubtractiveBlending,cp=l.TOUCH,Sr=l.TangentSpaceNormalMap,dp=l.TetrahedronGeometry,Et=l.Texture,wr=l.TextureLoader,hp=l.TorusGeometry,pp=l.TorusKnotGeometry,fp=l.Triangle,Ne=l.TriangleFanDrawMode,Ye=l.TriangleStripDrawMode,Lr=l.TrianglesDrawMode,mp=l.TubeGeometry,gp=l.TwoPassDoubleSide,_p=l.UVMapping,xp=l.Uint16BufferAttribute,Tp=l.Uint32BufferAttribute,vp=l.Uint8BufferAttribute,Ep=l.Uint8ClampedBufferAttribute,Mp=l.Uniform,Rp=l.UniformsGroup,Ee=l.UniformsLib,br=l.UniformsUtils,Ap=l.UnsignedByteType,yp=l.UnsignedInt248Type,Sp=l.UnsignedIntType,wp=l.UnsignedShort4444Type,Lp=l.UnsignedShort5551Type,bp=l.UnsignedShortType,Pp=l.VSMShadowMap,Q=l.Vector2,x=l.Vector3,Cp=l.Vector4,Mt=l.VectorKeyframeTrack,Ip=l.VideoTexture,Hp=l.WebGL1Renderer,Np=l.WebGL3DRenderTarget,Bp=l.WebGLArrayRenderTarget,Op=l.WebGLCoordinateSystem,Up=l.WebGLCubeRenderTarget,Dp=l.WebGLMultipleRenderTargets,Fp=l.WebGLRenderTarget,Vp=l.WebGLRenderer,kp=l.WebGLUtils,Gp=l.WebGPUCoordinateSystem,Wp=l.WireframeGeometry,zp=l.WrapAroundEnding,jp=l.ZeroCurvatureEnding,Xp=l.ZeroFactor,qp=l.ZeroSlopeEnding,Qp=l.ZeroStencilOp,Yp=l._SRGBAFormat,Kp=l.createCanvasElement,Zp=l.sRGBEncoding;function Rt(t,e){if(e===Lr)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),t;if(e===Ne||e===Ye){let n=t.getIndex();if(n===null){let s=[],u=t.getAttribute("position");if(u!==void 0){for(let a=0;a<u.count;a++)s.push(a);t.setIndex(s),n=t.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),t}let r=n.count-2,i=[];if(e===Ne)for(let s=1;s<=r;s++)i.push(n.getX(0)),i.push(n.getX(s)),i.push(n.getX(s+1));else for(let s=0;s<r;s++)s%2===0?(i.push(n.getX(s)),i.push(n.getX(s+1)),i.push(n.getX(s+2))):(i.push(n.getX(s+2)),i.push(n.getX(s+1)),i.push(n.getX(s)));i.length/3!==r&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let o=t.clone();return o.setIndex(i),o.clearGroups(),o}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),t}var Ke=class extends hr{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(n){return new Pt(n)}),this.register(function(n){return new Dt(n)}),this.register(function(n){return new Ft(n)}),this.register(function(n){return new Vt(n)}),this.register(function(n){return new It(n)}),this.register(function(n){return new Ht(n)}),this.register(function(n){return new Nt(n)}),this.register(function(n){return new Bt(n)}),this.register(function(n){return new bt(n)}),this.register(function(n){return new Ot(n)}),this.register(function(n){return new Ct(n)}),this.register(function(n){return new Ut(n)}),this.register(function(n){return new wt(n)}),this.register(function(n){return new kt(n)}),this.register(function(n){return new Gt(n)})}load(e,n,r,i){let o=this,s;this.resourcePath!==""?s=this.resourcePath:this.path!==""?s=this.path:s=Xe.extractUrlBase(e),this.manager.itemStart(e);let u=function(c){i?i(c):console.error(c),o.manager.itemError(e),o.manager.itemEnd(e)},a=new ht(this.manager);a.setPath(this.path),a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(e,function(c){try{o.parse(c,s,function(h){n(h),o.manager.itemEnd(e)},u)}catch(h){u(h)}},r,u)}setDRACOLoader(e){return this.dracoLoader=e,this}setDDSLoader(){throw new Error('THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".')}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,n,r,i){let o,s={},u={},a=new TextDecoder;if(typeof e=="string")o=JSON.parse(e);else if(e instanceof ArrayBuffer)if(a.decode(new Uint8Array(e,0,4))===Nr){try{s[b.KHR_BINARY_GLTF]=new Wt(e)}catch(d){i&&i(d);return}o=JSON.parse(s[b.KHR_BINARY_GLTF].content)}else o=JSON.parse(a.decode(e));else o=e;if(o.asset===void 0||o.asset.version[0]<2){i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let c=new Kt(o,{path:n||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){let d=this.pluginCallbacks[h](c);d.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),u[d.name]=d,s[d.name]=!0}if(o.extensionsUsed)for(let h=0;h<o.extensionsUsed.length;++h){let d=o.extensionsUsed[h],p=o.extensionsRequired||[];switch(d){case b.KHR_MATERIALS_UNLIT:s[d]=new Lt;break;case b.KHR_DRACO_MESH_COMPRESSION:s[d]=new zt(o,this.dracoLoader);break;case b.KHR_TEXTURE_TRANSFORM:s[d]=new jt;break;case b.KHR_MESH_QUANTIZATION:s[d]=new Xt;break;default:p.indexOf(d)>=0&&u[d]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+d+'".')}}c.setExtensions(s),c.setPlugins(u),c.parse(r,i)}parseAsync(e,n){let r=this;return new Promise(function(i,o){r.parse(e,n,i,o)})}};function xo(){let t={};return{get:function(e){return t[e]},add:function(e,n){t[e]=n},remove:function(e){delete t[e]},removeAll:function(){t={}}}}var b={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},wt=class{constructor(e){this.parser=e,this.name=b.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,n=this.parser.json.nodes||[];for(let r=0,i=n.length;r<i;r++){let o=n[r];o.extensions&&o.extensions[this.name]&&o.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,o.extensions[this.name].light)}}_loadLight(e){let n=this.parser,r="light:"+e,i=n.cache.get(r);if(i)return i;let o=n.json,a=((o.extensions&&o.extensions[this.name]||{}).lights||[])[e],c,h=new O(16777215);a.color!==void 0&&h.setRGB(a.color[0],a.color[1],a.color[2],J);let d=a.range!==void 0?a.range:0;switch(a.type){case"directional":c=new nr(h),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new Tr(h),c.distance=d;break;case"spot":c=new yr(h),c.distance=d,a.spot=a.spot||{},a.spot.innerConeAngle=a.spot.innerConeAngle!==void 0?a.spot.innerConeAngle:0,a.spot.outerConeAngle=a.spot.outerConeAngle!==void 0?a.spot.outerConeAngle:Math.PI/4,c.angle=a.spot.outerConeAngle,c.penumbra=1-a.spot.innerConeAngle/a.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+a.type)}return c.position.set(0,0,0),c.decay=2,se(c,a),a.intensity!==void 0&&(c.intensity=a.intensity),c.name=n.createUniqueName(a.name||"light_"+e),i=Promise.resolve(c),n.cache.add(r,i),i}getDependency(e,n){if(e==="light")return this._loadLight(n)}createNodeAttachment(e){let n=this,r=this.parser,o=r.json.nodes[e],u=(o.extensions&&o.extensions[this.name]||{}).light;return u===void 0?null:this._loadLight(u).then(function(a){return r._getNodeRef(n.cache,u,a)})}},Lt=class{constructor(){this.name=b.KHR_MATERIALS_UNLIT}getMaterialType(){return ee}extendParams(e,n,r){let i=[];e.color=new O(1,1,1),e.opacity=1;let o=n.pbrMetallicRoughness;if(o){if(Array.isArray(o.baseColorFactor)){let s=o.baseColorFactor;e.color.setRGB(s[0],s[1],s[2],J),e.opacity=s[3]}o.baseColorTexture!==void 0&&i.push(r.assignTexture(e,"map",o.baseColorTexture,ve))}return Promise.all(i)}},bt=class{constructor(e){this.parser=e,this.name=b.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,n){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let o=i.extensions[this.name].emissiveStrength;return o!==void 0&&(n.emissiveIntensity=o),Promise.resolve()}},Pt=class{constructor(e){this.parser=e,this.name=b.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){let r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:te}extendMaterialParams(e,n){let r=this.parser,i=r.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let o=[],s=i.extensions[this.name];if(s.clearcoatFactor!==void 0&&(n.clearcoat=s.clearcoatFactor),s.clearcoatTexture!==void 0&&o.push(r.assignTexture(n,"clearcoatMap",s.clearcoatTexture)),s.clearcoatRoughnessFactor!==void 0&&(n.clearcoatRoughness=s.clearcoatRoughnessFactor),s.clearcoatRoughnessTexture!==void 0&&o.push(r.assignTexture(n,"clearcoatRoughnessMap",s.clearcoatRoughnessTexture)),s.clearcoatNormalTexture!==void 0&&(o.push(r.assignTexture(n,"clearcoatNormalMap",s.clearcoatNormalTexture)),s.clearcoatNormalTexture.scale!==void 0)){let u=s.clearcoatNormalTexture.scale;n.clearcoatNormalScale=new Q(u,u)}return Promise.all(o)}},Ct=class{constructor(e){this.parser=e,this.name=b.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){let r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:te}extendMaterialParams(e,n){let r=this.parser,i=r.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let o=[],s=i.extensions[this.name];return s.iridescenceFactor!==void 0&&(n.iridescence=s.iridescenceFactor),s.iridescenceTexture!==void 0&&o.push(r.assignTexture(n,"iridescenceMap",s.iridescenceTexture)),s.iridescenceIor!==void 0&&(n.iridescenceIOR=s.iridescenceIor),n.iridescenceThicknessRange===void 0&&(n.iridescenceThicknessRange=[100,400]),s.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessRange[0]=s.iridescenceThicknessMinimum),s.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessRange[1]=s.iridescenceThicknessMaximum),s.iridescenceThicknessTexture!==void 0&&o.push(r.assignTexture(n,"iridescenceThicknessMap",s.iridescenceThicknessTexture)),Promise.all(o)}},It=class{constructor(e){this.parser=e,this.name=b.KHR_MATERIALS_SHEEN}getMaterialType(e){let r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:te}extendMaterialParams(e,n){let r=this.parser,i=r.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let o=[];n.sheenColor=new O(0,0,0),n.sheenRoughness=0,n.sheen=1;let s=i.extensions[this.name];if(s.sheenColorFactor!==void 0){let u=s.sheenColorFactor;n.sheenColor.setRGB(u[0],u[1],u[2],J)}return s.sheenRoughnessFactor!==void 0&&(n.sheenRoughness=s.sheenRoughnessFactor),s.sheenColorTexture!==void 0&&o.push(r.assignTexture(n,"sheenColorMap",s.sheenColorTexture,ve)),s.sheenRoughnessTexture!==void 0&&o.push(r.assignTexture(n,"sheenRoughnessMap",s.sheenRoughnessTexture)),Promise.all(o)}},Ht=class{constructor(e){this.parser=e,this.name=b.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){let r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:te}extendMaterialParams(e,n){let r=this.parser,i=r.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let o=[],s=i.extensions[this.name];return s.transmissionFactor!==void 0&&(n.transmission=s.transmissionFactor),s.transmissionTexture!==void 0&&o.push(r.assignTexture(n,"transmissionMap",s.transmissionTexture)),Promise.all(o)}},Nt=class{constructor(e){this.parser=e,this.name=b.KHR_MATERIALS_VOLUME}getMaterialType(e){let r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:te}extendMaterialParams(e,n){let r=this.parser,i=r.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let o=[],s=i.extensions[this.name];n.thickness=s.thicknessFactor!==void 0?s.thicknessFactor:0,s.thicknessTexture!==void 0&&o.push(r.assignTexture(n,"thicknessMap",s.thicknessTexture)),n.attenuationDistance=s.attenuationDistance||1/0;let u=s.attenuationColor||[1,1,1];return n.attenuationColor=new O().setRGB(u[0],u[1],u[2],J),Promise.all(o)}},Bt=class{constructor(e){this.parser=e,this.name=b.KHR_MATERIALS_IOR}getMaterialType(e){let r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:te}extendMaterialParams(e,n){let i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let o=i.extensions[this.name];return n.ior=o.ior!==void 0?o.ior:1.5,Promise.resolve()}},Ot=class{constructor(e){this.parser=e,this.name=b.KHR_MATERIALS_SPECULAR}getMaterialType(e){let r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:te}extendMaterialParams(e,n){let r=this.parser,i=r.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let o=[],s=i.extensions[this.name];n.specularIntensity=s.specularFactor!==void 0?s.specularFactor:1,s.specularTexture!==void 0&&o.push(r.assignTexture(n,"specularIntensityMap",s.specularTexture));let u=s.specularColorFactor||[1,1,1];return n.specularColor=new O().setRGB(u[0],u[1],u[2],J),s.specularColorTexture!==void 0&&o.push(r.assignTexture(n,"specularColorMap",s.specularColorTexture,ve)),Promise.all(o)}},Ut=class{constructor(e){this.parser=e,this.name=b.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){let r=this.parser.json.materials[e];return!r.extensions||!r.extensions[this.name]?null:te}extendMaterialParams(e,n){let r=this.parser,i=r.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();let o=[],s=i.extensions[this.name];return s.anisotropyStrength!==void 0&&(n.anisotropy=s.anisotropyStrength),s.anisotropyRotation!==void 0&&(n.anisotropyRotation=s.anisotropyRotation),s.anisotropyTexture!==void 0&&o.push(r.assignTexture(n,"anisotropyMap",s.anisotropyTexture)),Promise.all(o)}},Dt=class{constructor(e){this.parser=e,this.name=b.KHR_TEXTURE_BASISU}loadTexture(e){let n=this.parser,r=n.json,i=r.textures[e];if(!i.extensions||!i.extensions[this.name])return null;let o=i.extensions[this.name],s=n.options.ktx2Loader;if(!s){if(r.extensionsRequired&&r.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return n.loadTextureImage(e,o.source,s)}},Ft=class{constructor(e){this.parser=e,this.name=b.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){let n=this.name,r=this.parser,i=r.json,o=i.textures[e];if(!o.extensions||!o.extensions[n])return null;let s=o.extensions[n],u=i.images[s.source],a=r.textureLoader;if(u.uri){let c=r.options.manager.getHandler(u.uri);c!==null&&(a=c)}return this.detectSupport().then(function(c){if(c)return r.loadTextureImage(e,s.source,a);if(i.extensionsRequired&&i.extensionsRequired.indexOf(n)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return r.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let n=new Image;n.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",n.onload=n.onerror=function(){e(n.height===1)}})),this.isSupported}},Vt=class{constructor(e){this.parser=e,this.name=b.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){let n=this.name,r=this.parser,i=r.json,o=i.textures[e];if(!o.extensions||!o.extensions[n])return null;let s=o.extensions[n],u=i.images[s.source],a=r.textureLoader;if(u.uri){let c=r.options.manager.getHandler(u.uri);c!==null&&(a=c)}return this.detectSupport().then(function(c){if(c)return r.loadTextureImage(e,s.source,a);if(i.extensionsRequired&&i.extensionsRequired.indexOf(n)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return r.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let n=new Image;n.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",n.onload=n.onerror=function(){e(n.height===1)}})),this.isSupported}},kt=class{constructor(e){this.name=b.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){let n=this.parser.json,r=n.bufferViews[e];if(r.extensions&&r.extensions[this.name]){let i=r.extensions[this.name],o=this.parser.getDependency("buffer",i.buffer),s=this.parser.options.meshoptDecoder;if(!s||!s.supported){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return o.then(function(u){let a=i.byteOffset||0,c=i.byteLength||0,h=i.count,d=i.byteStride,p=new Uint8Array(u,a,c);return s.decodeGltfBufferAsync?s.decodeGltfBufferAsync(h,d,p,i.mode,i.filter).then(function(f){return f.buffer}):s.ready.then(function(){let f=new ArrayBuffer(h*d);return s.decodeGltfBuffer(new Uint8Array(f),h,d,p,i.mode,i.filter),f})})}else return null}},Gt=class{constructor(e){this.name=b.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let n=this.parser.json,r=n.nodes[e];if(!r.extensions||!r.extensions[this.name]||r.mesh===void 0)return null;let i=n.meshes[r.mesh];for(let c of i.primitives)if(c.mode!==W.TRIANGLES&&c.mode!==W.TRIANGLE_STRIP&&c.mode!==W.TRIANGLE_FAN&&c.mode!==void 0)return null;let s=r.extensions[this.name].attributes,u=[],a={};for(let c in s)u.push(this.parser.getDependency("accessor",s[c]).then(h=>(a[c]=h,a[c])));return u.length<1?null:(u.push(this.parser.createNodeMesh(e)),Promise.all(u).then(c=>{let h=c.pop(),d=h.isGroup?h.children:[h],p=c[0].count,f=[];for(let m of d){let g=new D,_=new x,T=new S,E=new x(1,1,1),R=new ar(m.geometry,m.material,p);for(let v=0;v<p;v++)a.TRANSLATION&&_.fromBufferAttribute(a.TRANSLATION,v),a.ROTATION&&T.fromBufferAttribute(a.ROTATION,v),a.SCALE&&E.fromBufferAttribute(a.SCALE,v),R.setMatrixAt(v,g.compose(_,T,E));for(let v in a)if(v==="_COLOR_0"){let M=a[v];R.instanceColor=new ft(M.array,M.itemSize,M.normalized)}else v!=="TRANSLATION"&&v!=="ROTATION"&&v!=="SCALE"&&m.geometry.setAttribute(v,a[v]);q.prototype.copy.call(R,m),this.parser.assignFinalMaterial(R),f.push(R)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}},Nr="glTF",Be=12,Pr={JSON:1313821514,BIN:5130562},Wt=class{constructor(e){this.name=b.KHR_BINARY_GLTF,this.content=null,this.body=null;let n=new DataView(e,0,Be),r=new TextDecoder;if(this.header={magic:r.decode(new Uint8Array(e.slice(0,4))),version:n.getUint32(4,!0),length:n.getUint32(8,!0)},this.header.magic!==Nr)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let i=this.header.length-Be,o=new DataView(e,Be),s=0;for(;s<i;){let u=o.getUint32(s,!0);s+=4;let a=o.getUint32(s,!0);if(s+=4,a===Pr.JSON){let c=new Uint8Array(e,Be+s,u);this.content=r.decode(c)}else if(a===Pr.BIN){let c=Be+s;this.body=e.slice(c,c+u)}s+=u}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},zt=class{constructor(e,n){if(!n)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=b.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=n,this.dracoLoader.preload()}decodePrimitive(e,n){let r=this.json,i=this.dracoLoader,o=e.extensions[this.name].bufferView,s=e.extensions[this.name].attributes,u={},a={},c={};for(let h in s){let d=Qt[h]||h.toLowerCase();u[d]=s[h]}for(let h in e.attributes){let d=Qt[h]||h.toLowerCase();if(s[h]!==void 0){let p=r.accessors[e.attributes[h]],f=Me[p.componentType];c[d]=f.name,a[d]=p.normalized===!0}}return n.getDependency("bufferView",o).then(function(h){return new Promise(function(d){i.decodeDracoFile(h,function(p){for(let f in p.attributes){let m=p.attributes[f],g=a[f];g!==void 0&&(m.normalized=g)}d(p)},u,c)})})}},jt=class{constructor(){this.name=b.KHR_TEXTURE_TRANSFORM}extendTexture(e,n){return(n.texCoord===void 0||n.texCoord===e.channel)&&n.offset===void 0&&n.rotation===void 0&&n.scale===void 0||(e=e.clone(),n.texCoord!==void 0&&(e.channel=n.texCoord),n.offset!==void 0&&e.offset.fromArray(n.offset),n.rotation!==void 0&&(e.rotation=n.rotation),n.scale!==void 0&&e.repeat.fromArray(n.scale),e.needsUpdate=!0),e}},Xt=class{constructor(){this.name=b.KHR_MESH_QUANTIZATION}},Ze=class extends lr{constructor(e,n,r,i){super(e,n,r,i)}copySampleValue_(e){let n=this.resultBuffer,r=this.sampleValues,i=this.valueSize,o=e*i*3+i;for(let s=0;s!==i;s++)n[s]=r[o+s];return n}interpolate_(e,n,r,i){let o=this.resultBuffer,s=this.sampleValues,u=this.valueSize,a=u*2,c=u*3,h=i-n,d=(r-n)/h,p=d*d,f=p*d,m=e*c,g=m-c,_=-2*f+3*p,T=f-p,E=1-_,R=T-p+d;for(let v=0;v!==u;v++){let M=s[g+v+u],A=s[g+v+a]*h,w=s[m+v+u],L=s[m+v]*h;o[v]=E*M+R*A+_*w+T*L}return o}},To=new S,qt=class extends Ze{interpolate_(e,n,r,i){let o=super.interpolate_(e,n,r,i);return To.fromArray(o).normalize().toArray(o),o}},W={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},Me={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},Cr={9728:fr,9729:gt,9984:gr,9985:dr,9986:mr,9987:_t},Ir={33071:tr,33648:pr,10497:qe},At={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Qt={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},oe={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},vo={CUBICSPLINE:void 0,LINEAR:mt,STEP:ur},yt={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Eo(t){return t.DefaultMaterial===void 0&&(t.DefaultMaterial=new xt({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:ir})),t.DefaultMaterial}function de(t,e,n){for(let r in n.extensions)t[r]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[r]=n.extensions[r])}function se(t,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(t.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Mo(t,e,n){let r=!1,i=!1,o=!1;for(let c=0,h=e.length;c<h;c++){let d=e[c];if(d.POSITION!==void 0&&(r=!0),d.NORMAL!==void 0&&(i=!0),d.COLOR_0!==void 0&&(o=!0),r&&i&&o)break}if(!r&&!i&&!o)return Promise.resolve(t);let s=[],u=[],a=[];for(let c=0,h=e.length;c<h;c++){let d=e[c];if(r){let p=d.POSITION!==void 0?n.getDependency("accessor",d.POSITION):t.attributes.position;s.push(p)}if(i){let p=d.NORMAL!==void 0?n.getDependency("accessor",d.NORMAL):t.attributes.normal;u.push(p)}if(o){let p=d.COLOR_0!==void 0?n.getDependency("accessor",d.COLOR_0):t.attributes.color;a.push(p)}}return Promise.all([Promise.all(s),Promise.all(u),Promise.all(a)]).then(function(c){let h=c[0],d=c[1],p=c[2];return r&&(t.morphAttributes.position=h),i&&(t.morphAttributes.normal=d),o&&(t.morphAttributes.color=p),t.morphTargetsRelative=!0,t})}function Ro(t,e){if(t.updateMorphTargets(),e.weights!==void 0)for(let n=0,r=e.weights.length;n<r;n++)t.morphTargetInfluences[n]=e.weights[n];if(e.extras&&Array.isArray(e.extras.targetNames)){let n=e.extras.targetNames;if(t.morphTargetInfluences.length===n.length){t.morphTargetDictionary={};for(let r=0,i=n.length;r<i;r++)t.morphTargetDictionary[n[r]]=r}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function Ao(t){let e,n=t.extensions&&t.extensions[b.KHR_DRACO_MESH_COMPRESSION];if(n?e="draco:"+n.bufferView+":"+n.indices+":"+St(n.attributes):e=t.indices+":"+St(t.attributes)+":"+t.mode,t.targets!==void 0)for(let r=0,i=t.targets.length;r<i;r++)e+=":"+St(t.targets[r]);return e}function St(t){let e="",n=Object.keys(t).sort();for(let r=0,i=n.length;r<i;r++)e+=n[r]+":"+t[n[r]]+";";return e}function Yt(t){switch(t){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function yo(t){return t.search(/\.jpe?g($|\?)/i)>0||t.search(/^data\:image\/jpeg/)===0?"image/jpeg":t.search(/\.webp($|\?)/i)>0||t.search(/^data\:image\/webp/)===0?"image/webp":"image/png"}var So=new D,Kt=class{constructor(e={},n={}){this.json=e,this.extensions={},this.plugins={},this.options=n,this.cache=new xo,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let r=!1,i=!1,o=-1;typeof navigator<"u"&&(r=/^((?!chrome|android).)*safari/i.test(navigator.userAgent)===!0,i=navigator.userAgent.indexOf("Firefox")>-1,o=i?navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]:-1),typeof createImageBitmap>"u"||r||i&&o<98?this.textureLoader=new wr(this.options.manager):this.textureLoader=new or(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new ht(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,n){let r=this,i=this.json,o=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(s){return s._markDefs&&s._markDefs()}),Promise.all(this._invokeAll(function(s){return s.beforeRoot&&s.beforeRoot()})).then(function(){return Promise.all([r.getDependencies("scene"),r.getDependencies("animation"),r.getDependencies("camera")])}).then(function(s){let u={scene:s[0][i.scene||0],scenes:s[0],animations:s[1],cameras:s[2],asset:i.asset,parser:r,userData:{}};return de(o,u,i),se(u,i),Promise.all(r._invokeAll(function(a){return a.afterRoot&&a.afterRoot(u)})).then(function(){e(u)})}).catch(n)}_markDefs(){let e=this.json.nodes||[],n=this.json.skins||[],r=this.json.meshes||[];for(let i=0,o=n.length;i<o;i++){let s=n[i].joints;for(let u=0,a=s.length;u<a;u++)e[s[u]].isBone=!0}for(let i=0,o=e.length;i<o;i++){let s=e[i];s.mesh!==void 0&&(this._addNodeRef(this.meshCache,s.mesh),s.skin!==void 0&&(r[s.mesh].isSkinnedMesh=!0)),s.camera!==void 0&&this._addNodeRef(this.cameraCache,s.camera)}}_addNodeRef(e,n){n!==void 0&&(e.refs[n]===void 0&&(e.refs[n]=e.uses[n]=0),e.refs[n]++)}_getNodeRef(e,n,r){if(e.refs[n]<=1)return r;let i=r.clone(),o=(s,u)=>{let a=this.associations.get(s);a!=null&&this.associations.set(u,a);for(let[c,h]of s.children.entries())o(h,u.children[c])};return o(r,i),i.name+="_instance_"+e.uses[n]++,i}_invokeOne(e){let n=Object.values(this.plugins);n.push(this);for(let r=0;r<n.length;r++){let i=e(n[r]);if(i)return i}return null}_invokeAll(e){let n=Object.values(this.plugins);n.unshift(this);let r=[];for(let i=0;i<n.length;i++){let o=e(n[i]);o&&r.push(o)}return r}getDependency(e,n){let r=e+":"+n,i=this.cache.get(r);if(!i){switch(e){case"scene":i=this.loadScene(n);break;case"node":i=this._invokeOne(function(o){return o.loadNode&&o.loadNode(n)});break;case"mesh":i=this._invokeOne(function(o){return o.loadMesh&&o.loadMesh(n)});break;case"accessor":i=this.loadAccessor(n);break;case"bufferView":i=this._invokeOne(function(o){return o.loadBufferView&&o.loadBufferView(n)});break;case"buffer":i=this.loadBuffer(n);break;case"material":i=this._invokeOne(function(o){return o.loadMaterial&&o.loadMaterial(n)});break;case"texture":i=this._invokeOne(function(o){return o.loadTexture&&o.loadTexture(n)});break;case"skin":i=this.loadSkin(n);break;case"animation":i=this._invokeOne(function(o){return o.loadAnimation&&o.loadAnimation(n)});break;case"camera":i=this.loadCamera(n);break;default:if(i=this._invokeOne(function(o){return o!=this&&o.getDependency&&o.getDependency(e,n)}),!i)throw new Error("Unknown type: "+e);break}this.cache.add(r,i)}return i}getDependencies(e){let n=this.cache.get(e);if(!n){let r=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];n=Promise.all(i.map(function(o,s){return r.getDependency(e,s)})),this.cache.add(e,n)}return n}loadBuffer(e){let n=this.json.buffers[e],r=this.fileLoader;if(n.type&&n.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+n.type+" buffer type is not supported.");if(n.uri===void 0&&e===0)return Promise.resolve(this.extensions[b.KHR_BINARY_GLTF].body);let i=this.options;return new Promise(function(o,s){r.load(Xe.resolveURL(n.uri,i.path),o,void 0,function(){s(new Error('THREE.GLTFLoader: Failed to load buffer "'+n.uri+'".'))})})}loadBufferView(e){let n=this.json.bufferViews[e];return this.getDependency("buffer",n.buffer).then(function(r){let i=n.byteLength||0,o=n.byteOffset||0;return r.slice(o,o+i)})}loadAccessor(e){let n=this,r=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){let s=At[i.type],u=Me[i.componentType],a=i.normalized===!0,c=new u(i.count*s);return Promise.resolve(new I(c,s,a))}let o=[];return i.bufferView!==void 0?o.push(this.getDependency("bufferView",i.bufferView)):o.push(null),i.sparse!==void 0&&(o.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),o.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(o).then(function(s){let u=s[0],a=At[i.type],c=Me[i.componentType],h=c.BYTES_PER_ELEMENT,d=h*a,p=i.byteOffset||0,f=i.bufferView!==void 0?r.bufferViews[i.bufferView].byteStride:void 0,m=i.normalized===!0,g,_;if(f&&f!==d){let T=Math.floor(p/f),E="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+T+":"+i.count,R=n.cache.get(E);R||(g=new c(u,T*f,i.count*f/h),R=new _e(g,f/h),n.cache.add(E,R)),_=new xe(R,a,p%f/h,m)}else u===null?g=new c(i.count*a):g=new c(u,p,i.count*a),_=new I(g,a,m);if(i.sparse!==void 0){let T=At.SCALAR,E=Me[i.sparse.indices.componentType],R=i.sparse.indices.byteOffset||0,v=i.sparse.values.byteOffset||0,M=new E(s[1],R,i.sparse.count*T),A=new c(s[2],v,i.sparse.count*a);u!==null&&(_=new I(_.array.slice(),_.itemSize,_.normalized));for(let w=0,L=M.length;w<L;w++){let H=M[w];if(_.setX(H,A[w*a]),a>=2&&_.setY(H,A[w*a+1]),a>=3&&_.setZ(H,A[w*a+2]),a>=4&&_.setW(H,A[w*a+3]),a>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}}return _})}loadTexture(e){let n=this.json,r=this.options,o=n.textures[e].source,s=n.images[o],u=this.textureLoader;if(s.uri){let a=r.manager.getHandler(s.uri);a!==null&&(u=a)}return this.loadTextureImage(e,o,u)}loadTextureImage(e,n,r){let i=this,o=this.json,s=o.textures[e],u=o.images[n],a=(u.uri||u.bufferView)+":"+s.sampler;if(this.textureCache[a])return this.textureCache[a];let c=this.loadImageSource(n,r).then(function(h){h.flipY=!1,h.name=s.name||u.name||"",h.name===""&&typeof u.uri=="string"&&u.uri.startsWith("data:image/")===!1&&(h.name=u.uri);let p=(o.samplers||{})[s.sampler]||{};return h.magFilter=Cr[p.magFilter]||gt,h.minFilter=Cr[p.minFilter]||_t,h.wrapS=Ir[p.wrapS]||qe,h.wrapT=Ir[p.wrapT]||qe,i.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[a]=c,c}loadImageSource(e,n){let r=this,i=this.json,o=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(d=>d.clone());let s=i.images[e],u=self.URL||self.webkitURL,a=s.uri||"",c=!1;if(s.bufferView!==void 0)a=r.getDependency("bufferView",s.bufferView).then(function(d){c=!0;let p=new Blob([d],{type:s.mimeType});return a=u.createObjectURL(p),a});else if(s.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let h=Promise.resolve(a).then(function(d){return new Promise(function(p,f){let m=p;n.isImageBitmapLoader===!0&&(m=function(g){let _=new Et(g);_.needsUpdate=!0,p(_)}),n.load(Xe.resolveURL(d,o.path),m,void 0,f)})}).then(function(d){return c===!0&&u.revokeObjectURL(a),d.userData.mimeType=s.mimeType||yo(s.uri),d}).catch(function(d){throw console.error("THREE.GLTFLoader: Couldn't load texture",a),d});return this.sourceCache[e]=h,h}assignTexture(e,n,r,i){let o=this;return this.getDependency("texture",r.index).then(function(s){if(!s)return null;if(r.texCoord!==void 0&&r.texCoord>0&&(s=s.clone(),s.channel=r.texCoord),o.extensions[b.KHR_TEXTURE_TRANSFORM]){let u=r.extensions!==void 0?r.extensions[b.KHR_TEXTURE_TRANSFORM]:void 0;if(u){let a=o.associations.get(s);s=o.extensions[b.KHR_TEXTURE_TRANSFORM].extendTexture(s,u),o.associations.set(s,a)}}return i!==void 0&&(s.colorSpace=i),e[n]=s,s})}assignFinalMaterial(e){let n=e.geometry,r=e.material,i=n.attributes.tangent===void 0,o=n.attributes.color!==void 0,s=n.attributes.normal===void 0;if(e.isPoints){let u="PointsMaterial:"+r.uuid,a=this.cache.get(u);a||(a=new Er,Te.prototype.copy.call(a,r),a.color.copy(r.color),a.map=r.map,a.sizeAttenuation=!1,this.cache.add(u,a)),r=a}else if(e.isLine){let u="LineBasicMaterial:"+r.uuid,a=this.cache.get(u);a||(a=new X,Te.prototype.copy.call(a,r),a.color.copy(r.color),a.map=r.map,this.cache.add(u,a)),r=a}if(i||o||s){let u="ClonedMaterial:"+r.uuid+":";i&&(u+="derivative-tangents:"),o&&(u+="vertex-colors:"),s&&(u+="flat-shading:");let a=this.cache.get(u);a||(a=r.clone(),o&&(a.vertexColors=!0),s&&(a.flatShading=!0),i&&(a.normalScale&&(a.normalScale.y*=-1),a.clearcoatNormalScale&&(a.clearcoatNormalScale.y*=-1)),this.cache.add(u,a),this.associations.set(a,this.associations.get(r))),r=a}e.material=r}getMaterialType(){return xt}loadMaterial(e){let n=this,r=this.json,i=this.extensions,o=r.materials[e],s,u={},a=o.extensions||{},c=[];if(a[b.KHR_MATERIALS_UNLIT]){let d=i[b.KHR_MATERIALS_UNLIT];s=d.getMaterialType(),c.push(d.extendParams(u,o,n))}else{let d=o.pbrMetallicRoughness||{};if(u.color=new O(1,1,1),u.opacity=1,Array.isArray(d.baseColorFactor)){let p=d.baseColorFactor;u.color.setRGB(p[0],p[1],p[2],J),u.opacity=p[3]}d.baseColorTexture!==void 0&&c.push(n.assignTexture(u,"map",d.baseColorTexture,ve)),u.metalness=d.metallicFactor!==void 0?d.metallicFactor:1,u.roughness=d.roughnessFactor!==void 0?d.roughnessFactor:1,d.metallicRoughnessTexture!==void 0&&(c.push(n.assignTexture(u,"metalnessMap",d.metallicRoughnessTexture)),c.push(n.assignTexture(u,"roughnessMap",d.metallicRoughnessTexture))),s=this._invokeOne(function(p){return p.getMaterialType&&p.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(p){return p.extendMaterialParams&&p.extendMaterialParams(e,u)})))}o.doubleSided===!0&&(u.side=Ce);let h=o.alphaMode||yt.OPAQUE;if(h===yt.BLEND?(u.transparent=!0,u.depthWrite=!1):(u.transparent=!1,h===yt.MASK&&(u.alphaTest=o.alphaCutoff!==void 0?o.alphaCutoff:.5)),o.normalTexture!==void 0&&s!==ee&&(c.push(n.assignTexture(u,"normalMap",o.normalTexture)),u.normalScale=new Q(1,1),o.normalTexture.scale!==void 0)){let d=o.normalTexture.scale;u.normalScale.set(d,d)}if(o.occlusionTexture!==void 0&&s!==ee&&(c.push(n.assignTexture(u,"aoMap",o.occlusionTexture)),o.occlusionTexture.strength!==void 0&&(u.aoMapIntensity=o.occlusionTexture.strength)),o.emissiveFactor!==void 0&&s!==ee){let d=o.emissiveFactor;u.emissive=new O().setRGB(d[0],d[1],d[2],J)}return o.emissiveTexture!==void 0&&s!==ee&&c.push(n.assignTexture(u,"emissiveMap",o.emissiveTexture,ve)),Promise.all(c).then(function(){let d=new s(u);return o.name&&(d.name=o.name),se(d,o),n.associations.set(d,{materials:e}),o.extensions&&de(i,d,o),d})}createUniqueName(e){let n=Mr.sanitizeNodeName(e||"");return n in this.nodeNamesUsed?n+"_"+ ++this.nodeNamesUsed[n]:(this.nodeNamesUsed[n]=0,n)}loadGeometries(e){let n=this,r=this.extensions,i=this.primitiveCache;function o(u){return r[b.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(u,n).then(function(a){return Hr(a,u,n)})}let s=[];for(let u=0,a=e.length;u<a;u++){let c=e[u],h=Ao(c),d=i[h];if(d)s.push(d.promise);else{let p;c.extensions&&c.extensions[b.KHR_DRACO_MESH_COMPRESSION]?p=o(c):p=Hr(new U,c,n),i[h]={primitive:c,promise:p},s.push(p)}}return Promise.all(s)}loadMesh(e){let n=this,r=this.json,i=this.extensions,o=r.meshes[e],s=o.primitives,u=[];for(let a=0,c=s.length;a<c;a++){let h=s[a].material===void 0?Eo(this.cache):this.getDependency("material",s[a].material);u.push(h)}return u.push(n.loadGeometries(s)),Promise.all(u).then(function(a){let c=a.slice(0,a.length-1),h=a[a.length-1],d=[];for(let f=0,m=h.length;f<m;f++){let g=h[f],_=s[f],T,E=c[f];if(_.mode===W.TRIANGLES||_.mode===W.TRIANGLE_STRIP||_.mode===W.TRIANGLE_FAN||_.mode===void 0)T=o.isSkinnedMesh===!0?new Qe(g,E):new He(g,E),T.isSkinnedMesh===!0&&T.normalizeSkinWeights(),_.mode===W.TRIANGLE_STRIP?T.geometry=Rt(T.geometry,Ye):_.mode===W.TRIANGLE_FAN&&(T.geometry=Rt(T.geometry,Ne));else if(_.mode===W.LINES)T=new re(g,E);else if(_.mode===W.LINE_STRIP)T=new je(g,E);else if(_.mode===W.LINE_LOOP)T=new cr(g,E);else if(_.mode===W.POINTS)T=new vr(g,E);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+_.mode);Object.keys(T.geometry.morphAttributes).length>0&&Ro(T,o),T.name=n.createUniqueName(o.name||"mesh_"+e),se(T,o),_.extensions&&de(i,T,_),n.assignFinalMaterial(T),d.push(T)}for(let f=0,m=d.length;f<m;f++)n.associations.set(d[f],{meshes:e,primitives:f});if(d.length===1)return o.extensions&&de(i,d[0],o),d[0];let p=new V;o.extensions&&de(i,p,o),n.associations.set(p,{meshes:e});for(let f=0,m=d.length;f<m;f++)p.add(d[f]);return p})}loadCamera(e){let n,r=this.json.cameras[e],i=r[r.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return r.type==="perspective"?n=new xr(N.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):r.type==="orthographic"&&(n=new _r(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),r.name&&(n.name=this.createUniqueName(r.name)),se(n,r),Promise.resolve(n)}loadSkin(e){let n=this.json.skins[e],r=[];for(let i=0,o=n.joints.length;i<o;i++)r.push(this._loadNodeShallow(n.joints[i]));return n.inverseBindMatrices!==void 0?r.push(this.getDependency("accessor",n.inverseBindMatrices)):r.push(null),Promise.all(r).then(function(i){let o=i.pop(),s=i,u=[],a=[];for(let c=0,h=s.length;c<h;c++){let d=s[c];if(d){u.push(d);let p=new D;o!==null&&p.fromArray(o.array,c*16),a.push(p)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',n.joints[c])}return new ie(u,a)})}loadAnimation(e){let n=this.json,r=this,i=n.animations[e],o=i.name?i.name:"animation_"+e,s=[],u=[],a=[],c=[],h=[];for(let d=0,p=i.channels.length;d<p;d++){let f=i.channels[d],m=i.samplers[f.sampler],g=f.target,_=g.node,T=i.parameters!==void 0?i.parameters[m.input]:m.input,E=i.parameters!==void 0?i.parameters[m.output]:m.output;g.node!==void 0&&(s.push(this.getDependency("node",_)),u.push(this.getDependency("accessor",T)),a.push(this.getDependency("accessor",E)),c.push(m),h.push(g))}return Promise.all([Promise.all(s),Promise.all(u),Promise.all(a),Promise.all(c),Promise.all(h)]).then(function(d){let p=d[0],f=d[1],m=d[2],g=d[3],_=d[4],T=[];for(let E=0,R=p.length;E<R;E++){let v=p[E],M=f[E],A=m[E],w=g[E],L=_[E];if(v===void 0)continue;v.updateMatrix&&v.updateMatrix();let H=r._createAnimationTracks(v,M,A,w,L);if(H)for(let C=0;C<H.length;C++)T.push(H[C])}return new Kn(o,void 0,T)})}createNodeMesh(e){let n=this.json,r=this,i=n.nodes[e];return i.mesh===void 0?null:r.getDependency("mesh",i.mesh).then(function(o){let s=r._getNodeRef(r.meshCache,i.mesh,o);return i.weights!==void 0&&s.traverse(function(u){if(u.isMesh)for(let a=0,c=i.weights.length;a<c;a++)u.morphTargetInfluences[a]=i.weights[a]}),s})}loadNode(e){let n=this.json,r=this,i=n.nodes[e],o=r._loadNodeShallow(e),s=[],u=i.children||[];for(let c=0,h=u.length;c<h;c++)s.push(r.getDependency("node",u[c]));let a=i.skin===void 0?Promise.resolve(null):r.getDependency("skin",i.skin);return Promise.all([o,Promise.all(s),a]).then(function(c){let h=c[0],d=c[1],p=c[2];p!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(p,So)});for(let f=0,m=d.length;f<m;f++)h.add(d[f]);return h})}_loadNodeShallow(e){let n=this.json,r=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let o=n.nodes[e],s=o.name?i.createUniqueName(o.name):"",u=[],a=i._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return a&&u.push(a),o.camera!==void 0&&u.push(i.getDependency("camera",o.camera).then(function(c){return i._getNodeRef(i.cameraCache,o.camera,c)})),i._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){u.push(c)}),this.nodeCache[e]=Promise.all(u).then(function(c){let h;if(o.isBone===!0?h=new Jn:c.length>1?h=new V:c.length===1?h=c[0]:h=new q,h!==c[0])for(let d=0,p=c.length;d<p;d++)h.add(c[d]);if(o.name&&(h.userData.name=o.name,h.name=s),se(h,o),o.extensions&&de(r,h,o),o.matrix!==void 0){let d=new D;d.fromArray(o.matrix),h.applyMatrix4(d)}else o.translation!==void 0&&h.position.fromArray(o.translation),o.rotation!==void 0&&h.quaternion.fromArray(o.rotation),o.scale!==void 0&&h.scale.fromArray(o.scale);return i.associations.has(h)||i.associations.set(h,{}),i.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){let n=this.extensions,r=this.json.scenes[e],i=this,o=new V;r.name&&(o.name=i.createUniqueName(r.name)),se(o,r),r.extensions&&de(n,o,r);let s=r.nodes||[],u=[];for(let a=0,c=s.length;a<c;a++)u.push(i.getDependency("node",s[a]));return Promise.all(u).then(function(a){for(let h=0,d=a.length;h<d;h++)o.add(a[h]);let c=h=>{let d=new Map;for(let[p,f]of i.associations)(p instanceof Te||p instanceof Et)&&d.set(p,f);return h.traverse(p=>{let f=i.associations.get(p);f!=null&&d.set(p,f)}),d};return i.associations=c(o),o})}_createAnimationTracks(e,n,r,i,o){let s=[],u=e.name?e.name:e.uuid,a=[];oe[o.path]===oe.weights?e.traverse(function(p){p.morphTargetInfluences&&a.push(p.name?p.name:p.uuid)}):a.push(u);let c;switch(oe[o.path]){case oe.weights:c=Tt;break;case oe.rotation:c=vt;break;case oe.position:case oe.scale:c=Mt;break;default:r.itemSize===1?c=Tt:c=Mt;break}let h=i.interpolation!==void 0?vo[i.interpolation]:mt,d=this._getArrayFromAccessor(r);for(let p=0,f=a.length;p<f;p++){let m=new c(a[p]+"."+oe[o.path],n.array,d,h);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(m),s.push(m)}return s}_getArrayFromAccessor(e){let n=e.array;if(e.normalized){let r=Yt(n.constructor),i=new Float32Array(n.length);for(let o=0,s=n.length;o<s;o++)i[o]=n[o]*r;n=i}return n}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(r){let i=this instanceof vt?qt:Ze;return new i(this.times,this.values,this.getValueSize()/3,r)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function wo(t,e,n){let r=e.attributes,i=new er;if(r.POSITION!==void 0){let u=n.json.accessors[r.POSITION],a=u.min,c=u.max;if(a!==void 0&&c!==void 0){if(i.set(new x(a[0],a[1],a[2]),new x(c[0],c[1],c[2])),u.normalized){let h=Yt(Me[u.componentType]);i.min.multiplyScalar(h),i.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let o=e.targets;if(o!==void 0){let u=new x,a=new x;for(let c=0,h=o.length;c<h;c++){let d=o[c];if(d.POSITION!==void 0){let p=n.json.accessors[d.POSITION],f=p.min,m=p.max;if(f!==void 0&&m!==void 0){if(a.setX(Math.max(Math.abs(f[0]),Math.abs(m[0]))),a.setY(Math.max(Math.abs(f[1]),Math.abs(m[1]))),a.setZ(Math.max(Math.abs(f[2]),Math.abs(m[2]))),p.normalized){let g=Yt(Me[p.componentType]);a.multiplyScalar(g)}u.max(a)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}i.expandByVector(u)}t.boundingBox=i;let s=new Ar;i.getCenter(s.center),s.radius=i.min.distanceTo(i.max)/2,t.boundingSphere=s}function Hr(t,e,n){let r=e.attributes,i=[];function o(s,u){return n.getDependency("accessor",s).then(function(a){t.setAttribute(u,a)})}for(let s in r){let u=Qt[s]||s.toLowerCase();u in t.attributes||i.push(o(r[s],u))}if(e.indices!==void 0&&!t.index){let s=n.getDependency("accessor",e.indices).then(function(u){t.setIndex(u)});i.push(s)}return dt.workingColorSpace!==J&&"COLOR_0"in r&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${dt.workingColorSpace}" not supported.`),se(t,e),wo(t,e,n),Promise.all(i).then(function(){return e.targets!==void 0?Mo(t,e.targets,n):t})}var $e=(t,e,n)=>new Promise((r,i)=>{var o=a=>{try{u(n.next(a))}catch(c){i(c)}},s=a=>{try{u(n.throw(a))}catch(c){i(c)}},u=a=>a.done?r(a.value):Promise.resolve(a.value).then(o,s);u((n=n.apply(t,e)).next())}),P=(t,e,n)=>new Promise((r,i)=>{var o=a=>{try{u(n.next(a))}catch(c){i(c)}},s=a=>{try{u(n.throw(a))}catch(c){i(c)}},u=a=>a.done?r(a.value):Promise.resolve(a.value).then(o,s);u((n=n.apply(t,e)).next())}),Br=class extends q{constructor(t){super(),this.weight=0,this.isBinary=!1,this.overrideBlink="none",this.overrideLookAt="none",this.overrideMouth="none",this._binds=[],this.name=`VRMExpression_${t}`,this.expressionName=t,this.type="VRMExpression",this.visible=!1}get binds(){return this._binds}get overrideBlinkAmount(){return this.overrideBlink==="block"?0<this.outputWeight?1:0:this.overrideBlink==="blend"?this.outputWeight:0}get overrideLookAtAmount(){return this.overrideLookAt==="block"?0<this.outputWeight?1:0:this.overrideLookAt==="blend"?this.outputWeight:0}get overrideMouthAmount(){return this.overrideMouth==="block"?0<this.outputWeight?1:0:this.overrideMouth==="blend"?this.outputWeight:0}get outputWeight(){return this.isBinary?this.weight>.5?1:0:this.weight}addBind(t){this._binds.push(t)}deleteBind(t){let e=this._binds.indexOf(t);e>=0&&this._binds.splice(e,1)}applyWeight(t){var e;let n=this.outputWeight;n*=(e=t?.multiplier)!=null?e:1,this.isBinary&&n<1&&(n=0),this._binds.forEach(r=>r.applyWeight(n))}clearAppliedWeight(){this._binds.forEach(t=>t.clearAppliedWeight())}};function _i(t,e,n){var r,i;let o=t.parser.json,s=(r=o.nodes)==null?void 0:r[e];if(s==null)return console.warn(`extractPrimitivesInternal: Attempt to use nodes[${e}] of glTF but the node doesn't exist`),null;let u=s.mesh;if(u==null)return null;let a=(i=o.meshes)==null?void 0:i[u];if(a==null)return console.warn(`extractPrimitivesInternal: Attempt to use meshes[${u}] of glTF but the mesh doesn't exist`),null;let c=a.primitives.length,h=[];return n.traverse(d=>{h.length<c&&d.isMesh&&h.push(d)}),h}function Or(t,e){return P(this,null,function*(){let n=yield t.parser.getDependency("node",e);return _i(t,e,n)})}function Ur(t){return P(this,null,function*(){let e=yield t.parser.getDependencies("node"),n=new Map;return e.forEach((r,i)=>{let o=_i(t,i,r);o!=null&&n.set(i,o)}),n})}var cn={Aa:"aa",Ih:"ih",Ou:"ou",Ee:"ee",Oh:"oh",Blink:"blink",Happy:"happy",Angry:"angry",Sad:"sad",Relaxed:"relaxed",LookUp:"lookUp",Surprised:"surprised",LookDown:"lookDown",LookLeft:"lookLeft",LookRight:"lookRight",BlinkLeft:"blinkLeft",BlinkRight:"blinkRight",Neutral:"neutral"};function xi(t){return Math.max(Math.min(t,1),0)}var Dr=class Ti{constructor(){this.blinkExpressionNames=["blink","blinkLeft","blinkRight"],this.lookAtExpressionNames=["lookLeft","lookRight","lookUp","lookDown"],this.mouthExpressionNames=["aa","ee","ih","oh","ou"],this._expressions=[],this._expressionMap={}}get expressions(){return this._expressions.concat()}get expressionMap(){return Object.assign({},this._expressionMap)}get presetExpressionMap(){let e={},n=new Set(Object.values(cn));return Object.entries(this._expressionMap).forEach(([r,i])=>{n.has(r)&&(e[r]=i)}),e}get customExpressionMap(){let e={},n=new Set(Object.values(cn));return Object.entries(this._expressionMap).forEach(([r,i])=>{n.has(r)||(e[r]=i)}),e}copy(e){return this._expressions.concat().forEach(r=>{this.unregisterExpression(r)}),e._expressions.forEach(r=>{this.registerExpression(r)}),this.blinkExpressionNames=e.blinkExpressionNames.concat(),this.lookAtExpressionNames=e.lookAtExpressionNames.concat(),this.mouthExpressionNames=e.mouthExpressionNames.concat(),this}clone(){return new Ti().copy(this)}getExpression(e){var n;return(n=this._expressionMap[e])!=null?n:null}registerExpression(e){this._expressions.push(e),this._expressionMap[e.expressionName]=e}unregisterExpression(e){let n=this._expressions.indexOf(e);n===-1&&console.warn("VRMExpressionManager: The specified expressions is not registered"),this._expressions.splice(n,1),delete this._expressionMap[e.expressionName]}getValue(e){var n;let r=this.getExpression(e);return(n=r?.weight)!=null?n:null}setValue(e,n){let r=this.getExpression(e);r&&(r.weight=xi(n))}resetValues(){this._expressions.forEach(e=>{e.weight=0})}getExpressionTrackName(e){let n=this.getExpression(e);return n?`${n.name}.weight`:null}update(){let e=this._calculateWeightMultipliers();this._expressions.forEach(n=>{n.clearAppliedWeight()}),this._expressions.forEach(n=>{let r=1,i=n.expressionName;this.blinkExpressionNames.indexOf(i)!==-1&&(r*=e.blink),this.lookAtExpressionNames.indexOf(i)!==-1&&(r*=e.lookAt),this.mouthExpressionNames.indexOf(i)!==-1&&(r*=e.mouth),n.applyWeight({multiplier:r})})}_calculateWeightMultipliers(){let e=1,n=1,r=1;return this._expressions.forEach(i=>{e-=i.overrideBlinkAmount,n-=i.overrideLookAtAmount,r-=i.overrideMouthAmount}),e=Math.max(0,e),n=Math.max(0,n),r=Math.max(0,r),{blink:e,lookAt:n,mouth:r}}},Oe={Color:"color",EmissionColor:"emissionColor",ShadeColor:"shadeColor",MatcapColor:"matcapColor",RimColor:"rimColor",OutlineColor:"outlineColor"},Lo={_Color:Oe.Color,_EmissionColor:Oe.EmissionColor,_ShadeColor:Oe.ShadeColor,_RimColor:Oe.RimColor,_OutlineColor:Oe.OutlineColor},bo=new O,vi=class Ei{constructor({material:e,type:n,targetValue:r,targetAlpha:i}){this.material=e,this.type=n,this.targetValue=r,this.targetAlpha=i??1;let o=this._initColorBindState(),s=this._initAlphaBindState();this._state={color:o,alpha:s}}applyWeight(e){let{color:n,alpha:r}=this._state;if(n!=null){let{propertyName:i,deltaValue:o}=n,s=this.material[i];s?.add(bo.copy(o).multiplyScalar(e))}if(r!=null){let{propertyName:i,deltaValue:o}=r;this.material[i]!=null&&(this.material[i]+=o*e)}}clearAppliedWeight(){let{color:e,alpha:n}=this._state;if(e!=null){let{propertyName:r,initialValue:i}=e,o=this.material[r];o?.copy(i)}if(n!=null){let{propertyName:r,initialValue:i}=n;this.material[r]!=null&&(this.material[r]=i)}}_initColorBindState(){var e,n,r;let{material:i,type:o,targetValue:s}=this,u=this._getPropertyNameMap(),a=(n=(e=u?.[o])==null?void 0:e[0])!=null?n:null;if(a==null)return console.warn(`Tried to add a material color bind to the material ${(r=i.name)!=null?r:"(no name)"}, the type ${o} but the material or the type is not supported.`),null;let h=i[a].clone(),d=new O(s.r-h.r,s.g-h.g,s.b-h.b);return{propertyName:a,initialValue:h,deltaValue:d}}_initAlphaBindState(){var e,n,r;let{material:i,type:o,targetAlpha:s}=this,u=this._getPropertyNameMap(),a=(n=(e=u?.[o])==null?void 0:e[1])!=null?n:null;if(a==null&&s!==1)return console.warn(`Tried to add a material alpha bind to the material ${(r=i.name)!=null?r:"(no name)"}, the type ${o} but the material or the type does not support alpha.`),null;if(a==null)return null;let c=i[a],h=s-c;return{propertyName:a,initialValue:c,deltaValue:h}}_getPropertyNameMap(){var e,n;return(n=(e=Object.entries(Ei._propertyNameMapMap).find(([r])=>this.material[r]===!0))==null?void 0:e[1])!=null?n:null}};vi._propertyNameMapMap={isMeshStandardMaterial:{color:["color","opacity"],emissionColor:["emissive",null]},isMeshBasicMaterial:{color:["color","opacity"]},isMToonMaterial:{color:["color","opacity"],emissionColor:["emissive",null],outlineColor:["outlineColorFactor",null],matcapColor:["matcapFactor",null],rimColor:["parametricRimColorFactor",null],shadeColor:["shadeColorFactor",null]}};var Fr=vi,ot=class{constructor({primitives:t,index:e,weight:n}){this.primitives=t,this.index=e,this.weight=n}applyWeight(t){this.primitives.forEach(e=>{var n;((n=e.morphTargetInfluences)==null?void 0:n[this.index])!=null&&(e.morphTargetInfluences[this.index]+=this.weight*t)})}clearAppliedWeight(){this.primitives.forEach(t=>{var e;((e=t.morphTargetInfluences)==null?void 0:e[this.index])!=null&&(t.morphTargetInfluences[this.index]=0)})}},Vr=new Q,Mi=class Ri{constructor({material:e,scale:n,offset:r}){var i,o;this.material=e,this.scale=n,this.offset=r;let s=(i=Object.entries(Ri._propertyNamesMap).find(([u])=>e[u]===!0))==null?void 0:i[1];s==null?(console.warn(`Tried to add a texture transform bind to the material ${(o=e.name)!=null?o:"(no name)"} but the material is not supported.`),this._properties=[]):(this._properties=[],s.forEach(u=>{var a;let c=(a=e[u])==null?void 0:a.clone();if(!c)return null;e[u]=c;let h=c.offset.clone(),d=c.repeat.clone(),p=r.clone().sub(h),f=n.clone().sub(d);this._properties.push({name:u,initialOffset:h,deltaOffset:p,initialScale:d,deltaScale:f})}))}applyWeight(e){this._properties.forEach(n=>{let r=this.material[n.name];r!==void 0&&(r.offset.add(Vr.copy(n.deltaOffset).multiplyScalar(e)),r.repeat.add(Vr.copy(n.deltaScale).multiplyScalar(e)))})}clearAppliedWeight(){this._properties.forEach(e=>{let n=this.material[e.name];n!==void 0&&(n.offset.copy(e.initialOffset),n.repeat.copy(e.initialScale))})}};Mi._propertyNamesMap={isMeshStandardMaterial:["map","emissiveMap","bumpMap","normalMap","displacementMap","roughnessMap","metalnessMap","alphaMap"],isMeshBasicMaterial:["map","specularMap","alphaMap"],isMToonMaterial:["map","normalMap","emissiveMap","shadeMultiplyTexture","rimMultiplyTexture","outlineWidthMultiplyTexture","uvAnimationMaskTexture"]};var kr=Mi,Po=new Set(["1.0","1.0-beta"]),Ai=class yi{get name(){return"VRMExpressionLoaderPlugin"}constructor(e){this.parser=e}afterRoot(e){return P(this,null,function*(){e.userData.vrmExpressionManager=yield this._import(e)})}_import(e){return P(this,null,function*(){let n=yield this._v1Import(e);if(n)return n;let r=yield this._v0Import(e);return r||null})}_v1Import(e){return P(this,null,function*(){var n,r;let i=this.parser.json;if(!(((n=i.extensionsUsed)==null?void 0:n.indexOf("VRMC_vrm"))!==-1))return null;let s=(r=i.extensions)==null?void 0:r.VRMC_vrm;if(!s)return null;let u=s.specVersion;if(!Po.has(u))return console.warn(`VRMExpressionLoaderPlugin: Unknown VRMC_vrm specVersion "${u}"`),null;let a=s.expressions;if(!a)return null;let c=new Set(Object.values(cn)),h=new Map;a.preset!=null&&Object.entries(a.preset).forEach(([p,f])=>{if(f!=null){if(!c.has(p)){console.warn(`VRMExpressionLoaderPlugin: Unknown preset name "${p}" detected. Ignoring the expression`);return}h.set(p,f)}}),a.custom!=null&&Object.entries(a.custom).forEach(([p,f])=>{if(c.has(p)){console.warn(`VRMExpressionLoaderPlugin: Custom expression cannot have preset name "${p}". Ignoring the expression`);return}h.set(p,f)});let d=new Dr;return yield Promise.all(Array.from(h.entries()).map(p=>P(this,[p],function*([f,m]){var g,_,T,E,R,v,M;let A=new Br(f);if(e.scene.add(A),A.isBinary=(g=m.isBinary)!=null?g:!1,A.overrideBlink=(_=m.overrideBlink)!=null?_:"none",A.overrideLookAt=(T=m.overrideLookAt)!=null?T:"none",A.overrideMouth=(E=m.overrideMouth)!=null?E:"none",(R=m.morphTargetBinds)==null||R.forEach(w=>P(this,null,function*(){var L;if(w.node===void 0||w.index===void 0)return;let H=yield Or(e,w.node),C=w.index;if(!H.every(B=>Array.isArray(B.morphTargetInfluences)&&C<B.morphTargetInfluences.length)){console.warn(`VRMExpressionLoaderPlugin: ${m.name} attempts to index morph #${C} but not found.`);return}A.addBind(new ot({primitives:H,index:C,weight:(L=w.weight)!=null?L:1}))})),m.materialColorBinds||m.textureTransformBinds){let w=[];e.scene.traverse(L=>{let H=L.material;H&&(Array.isArray(H)?w.push(...H):w.push(H))}),(v=m.materialColorBinds)==null||v.forEach(L=>P(this,null,function*(){w.filter(C=>{var B;let F=(B=this.parser.associations.get(C))==null?void 0:B.materials;return L.material===F}).forEach(C=>{A.addBind(new Fr({material:C,type:L.type,targetValue:new O().fromArray(L.targetValue),targetAlpha:L.targetValue[3]}))})})),(M=m.textureTransformBinds)==null||M.forEach(L=>P(this,null,function*(){w.filter(C=>{var B;let F=(B=this.parser.associations.get(C))==null?void 0:B.materials;return L.material===F}).forEach(C=>{var B,F;A.addBind(new kr({material:C,offset:new Q().fromArray((B=L.offset)!=null?B:[0,0]),scale:new Q().fromArray((F=L.scale)!=null?F:[1,1])}))})}))}d.registerExpression(A)}))),d})}_v0Import(e){return P(this,null,function*(){var n;let r=this.parser.json,i=(n=r.extensions)==null?void 0:n.VRM;if(!i)return null;let o=i.blendShapeMaster;if(!o)return null;let s=new Dr,u=o.blendShapeGroups;if(!u)return s;let a=new Set;return yield Promise.all(u.map(c=>P(this,null,function*(){var h;let d=c.presetName,p=d!=null&&yi.v0v1PresetNameMap[d]||null,f=p??c.name;if(f==null){console.warn("VRMExpressionLoaderPlugin: One of custom expressions has no name. Ignoring the expression");return}if(a.has(f)){console.warn(`VRMExpressionLoaderPlugin: An expression preset ${d} has duplicated entries. Ignoring the expression`);return}a.add(f);let m=new Br(f);e.scene.add(m),m.isBinary=(h=c.isBinary)!=null?h:!1,c.binds&&c.binds.forEach(_=>P(this,null,function*(){var T;if(_.mesh===void 0||_.index===void 0)return;let E=[];if((T=r.nodes)==null||T.forEach((v,M)=>{v.mesh===_.mesh&&E.push(M)}),E.length===0){console.warn(`VRMExpressionLoaderPlugin: ${c.name} attempts to bind a morph target to the mesh #${_.mesh} but the mesh is not found or not used in the scene. Ignoring the bind.`);return}let R=_.index;yield Promise.all(E.map(v=>P(this,null,function*(){var M;let A=yield Or(e,v);if(!A.every(w=>Array.isArray(w.morphTargetInfluences)&&R<w.morphTargetInfluences.length)){console.warn(`VRMExpressionLoaderPlugin: ${c.name} attempts to index ${R}th morph but not found.`);return}m.addBind(new ot({primitives:A,index:R,weight:.01*((M=_.weight)!=null?M:100)}))})))}));let g=c.materialValues;g&&g.length!==0&&g.forEach(_=>{if(_.materialName===void 0||_.propertyName===void 0||_.targetValue===void 0)return;let T=[];e.scene.traverse(R=>{if(R.material){let v=R.material;Array.isArray(v)?T.push(...v.filter(M=>(M.name===_.materialName||M.name===_.materialName+" (Outline)")&&T.indexOf(M)===-1)):v.name===_.materialName&&T.indexOf(v)===-1&&T.push(v)}});let E=_.propertyName;T.forEach(R=>{if(E==="_MainTex_ST"){let M=new Q(_.targetValue[0],_.targetValue[1]),A=new Q(_.targetValue[2],_.targetValue[3]);A.y=1-A.y-M.y,m.addBind(new kr({material:R,scale:M,offset:A}));return}let v=Lo[E];if(v){m.addBind(new Fr({material:R,type:v,targetValue:new O().fromArray(_.targetValue),targetAlpha:_.targetValue[3]}));return}console.warn(E+" is not supported")})}),s.registerExpression(m)}))),s})}};Ai.v0v1PresetNameMap={a:"aa",e:"ee",i:"ih",o:"oh",u:"ou",blink:"blink",joy:"happy",angry:"angry",sorrow:"sad",fun:"relaxed",lookup:"lookUp",lookdown:"lookDown",lookleft:"lookLeft",lookright:"lookRight",blink_l:"blinkLeft",blink_r:"blinkRight",neutral:"neutral"};var Co=Ai;var gn=class Se{constructor(e,n){this._firstPersonOnlyLayer=Se.DEFAULT_FIRSTPERSON_ONLY_LAYER,this._thirdPersonOnlyLayer=Se.DEFAULT_THIRDPERSON_ONLY_LAYER,this._initializedLayers=!1,this.humanoid=e,this.meshAnnotations=n}copy(e){if(this.humanoid!==e.humanoid)throw new Error("VRMFirstPerson: humanoid must be same in order to copy");return this.meshAnnotations=e.meshAnnotations.map(n=>({meshes:n.meshes.concat(),type:n.type})),this}clone(){return new Se(this.humanoid,this.meshAnnotations).copy(this)}get firstPersonOnlyLayer(){return this._firstPersonOnlyLayer}get thirdPersonOnlyLayer(){return this._thirdPersonOnlyLayer}setup({firstPersonOnlyLayer:e=Se.DEFAULT_FIRSTPERSON_ONLY_LAYER,thirdPersonOnlyLayer:n=Se.DEFAULT_THIRDPERSON_ONLY_LAYER}={}){this._initializedLayers||(this._firstPersonOnlyLayer=e,this._thirdPersonOnlyLayer=n,this.meshAnnotations.forEach(r=>{r.meshes.forEach(i=>{r.type==="firstPersonOnly"?(i.layers.set(this._firstPersonOnlyLayer),i.traverse(o=>o.layers.set(this._firstPersonOnlyLayer))):r.type==="thirdPersonOnly"?(i.layers.set(this._thirdPersonOnlyLayer),i.traverse(o=>o.layers.set(this._thirdPersonOnlyLayer))):r.type==="auto"&&this._createHeadlessModel(i)})}),this._initializedLayers=!0)}_excludeTriangles(e,n,r,i){let o=0;if(n!=null&&n.length>0)for(let s=0;s<e.length;s+=3){let u=e[s],a=e[s+1],c=e[s+2],h=n[u],d=r[u];if(h[0]>0&&i.includes(d[0])||h[1]>0&&i.includes(d[1])||h[2]>0&&i.includes(d[2])||h[3]>0&&i.includes(d[3]))continue;let p=n[a],f=r[a];if(p[0]>0&&i.includes(f[0])||p[1]>0&&i.includes(f[1])||p[2]>0&&i.includes(f[2])||p[3]>0&&i.includes(f[3]))continue;let m=n[c],g=r[c];m[0]>0&&i.includes(g[0])||m[1]>0&&i.includes(g[1])||m[2]>0&&i.includes(g[2])||m[3]>0&&i.includes(g[3])||(e[o++]=u,e[o++]=a,e[o++]=c)}return o}_createErasedMesh(e,n){let r=new Qe(e.geometry.clone(),e.material);r.name=`${e.name}(erase)`,r.frustumCulled=e.frustumCulled,r.layers.set(this._firstPersonOnlyLayer);let i=r.geometry,o=i.getAttribute("skinIndex"),s=o instanceof pt?[]:o.array,u=[];for(let g=0;g<s.length;g+=4)u.push([s[g],s[g+1],s[g+2],s[g+3]]);let a=i.getAttribute("skinWeight"),c=a instanceof pt?[]:a.array,h=[];for(let g=0;g<c.length;g+=4)h.push([c[g],c[g+1],c[g+2],c[g+3]]);let d=i.getIndex();if(!d)throw new Error("The geometry doesn't have an index buffer");let p=Array.from(d.array),f=this._excludeTriangles(p,h,u,n),m=[];for(let g=0;g<f;g++)m[g]=p[g];return i.setIndex(m),e.onBeforeRender&&(r.onBeforeRender=e.onBeforeRender),r.bind(new ie(e.skeleton.bones,e.skeleton.boneInverses),new D),r}_createHeadlessModelForSkinnedMesh(e,n){let r=[];if(n.skeleton.bones.forEach((o,s)=>{this._isEraseTarget(o)&&r.push(s)}),!r.length){n.layers.enable(this._thirdPersonOnlyLayer),n.layers.enable(this._firstPersonOnlyLayer);return}n.layers.set(this._thirdPersonOnlyLayer);let i=this._createErasedMesh(n,r);e.add(i)}_createHeadlessModel(e){if(e.type==="Group")if(e.layers.set(this._thirdPersonOnlyLayer),this._isEraseTarget(e))e.traverse(n=>n.layers.set(this._thirdPersonOnlyLayer));else{let n=new V;n.name=`_headless_${e.name}`,n.layers.set(this._firstPersonOnlyLayer),e.parent.add(n),e.children.filter(r=>r.type==="SkinnedMesh").forEach(r=>{let i=r;this._createHeadlessModelForSkinnedMesh(n,i)})}else if(e.type==="SkinnedMesh"){let n=e;this._createHeadlessModelForSkinnedMesh(e.parent,n)}else this._isEraseTarget(e)&&(e.layers.set(this._thirdPersonOnlyLayer),e.traverse(n=>n.layers.set(this._thirdPersonOnlyLayer)))}_isEraseTarget(e){return e===this.humanoid.getRawBoneNode("head")?!0:e.parent?this._isEraseTarget(e.parent):!1}};gn.DEFAULT_FIRSTPERSON_ONLY_LAYER=9;gn.DEFAULT_THIRDPERSON_ONLY_LAYER=10;var Gr=gn,Io=new Set(["1.0","1.0-beta"]),Ho=class{get name(){return"VRMFirstPersonLoaderPlugin"}constructor(t){this.parser=t}afterRoot(t){return P(this,null,function*(){let e=t.userData.vrmHumanoid;if(e!==null){if(e===void 0)throw new Error("VRMFirstPersonLoaderPlugin: vrmHumanoid is undefined. VRMHumanoidLoaderPlugin have to be used first");t.userData.vrmFirstPerson=yield this._import(t,e)}})}_import(t,e){return P(this,null,function*(){if(e==null)return null;let n=yield this._v1Import(t,e);if(n)return n;let r=yield this._v0Import(t,e);return r||null})}_v1Import(t,e){return P(this,null,function*(){var n,r;let i=this.parser.json;if(!(((n=i.extensionsUsed)==null?void 0:n.indexOf("VRMC_vrm"))!==-1))return null;let s=(r=i.extensions)==null?void 0:r.VRMC_vrm;if(!s)return null;let u=s.specVersion;if(!Io.has(u))return console.warn(`VRMFirstPersonLoaderPlugin: Unknown VRMC_vrm specVersion "${u}"`),null;let a=s.firstPerson,c=[],h=yield Ur(t);return Array.from(h.entries()).forEach(([d,p])=>{var f,m;let g=(f=a?.meshAnnotations)==null?void 0:f.find(_=>_.node===d);c.push({meshes:p,type:(m=g?.type)!=null?m:"auto"})}),new Gr(e,c)})}_v0Import(t,e){return P(this,null,function*(){var n;let r=this.parser.json,i=(n=r.extensions)==null?void 0:n.VRM;if(!i)return null;let o=i.firstPerson;if(!o)return null;let s=[],u=yield Ur(t);return Array.from(u.entries()).forEach(([a,c])=>{let h=r.nodes[a],d=o.meshAnnotations?o.meshAnnotations.find(p=>p.mesh===h.mesh):void 0;s.push({meshes:c,type:this._convertV0FlagToV1Type(d?.firstPersonFlag)})}),new Gr(e,s)})}_convertV0FlagToV1Type(t){return t==="FirstPersonOnly"?"firstPersonOnly":t==="ThirdPersonOnly"?"thirdPersonOnly":t==="Both"?"both":"auto"}};var Wr=new x,zr=new x,No=new S,jr=class extends V{constructor(t){super(),this.vrmHumanoid=t,this._boneAxesMap=new Map,Object.values(t.humanBones).forEach(e=>{let n=new Zn(1);n.matrixAutoUpdate=!1,n.material.depthTest=!1,n.material.depthWrite=!1,this.add(n),this._boneAxesMap.set(e,n)})}dispose(){Array.from(this._boneAxesMap.values()).forEach(t=>{t.geometry.dispose(),t.material.dispose()})}updateMatrixWorld(t){Array.from(this._boneAxesMap.entries()).forEach(([e,n])=>{e.node.updateWorldMatrix(!0,!1),e.node.matrixWorld.decompose(Wr,No,zr);let r=Wr.set(.1,.1,.1).divide(zr);n.matrix.copy(e.node.matrixWorld).scale(r)}),super.updateMatrixWorld(t)}},Zt=["hips","spine","chest","upperChest","neck","head","leftEye","rightEye","jaw","leftUpperLeg","leftLowerLeg","leftFoot","leftToes","rightUpperLeg","rightLowerLeg","rightFoot","rightToes","leftShoulder","leftUpperArm","leftLowerArm","leftHand","rightShoulder","rightUpperArm","rightLowerArm","rightHand","leftThumbMetacarpal","leftThumbProximal","leftThumbDistal","leftIndexProximal","leftIndexIntermediate","leftIndexDistal","leftMiddleProximal","leftMiddleIntermediate","leftMiddleDistal","leftRingProximal","leftRingIntermediate","leftRingDistal","leftLittleProximal","leftLittleIntermediate","leftLittleDistal","rightThumbMetacarpal","rightThumbProximal","rightThumbDistal","rightIndexProximal","rightIndexIntermediate","rightIndexDistal","rightMiddleProximal","rightMiddleIntermediate","rightMiddleDistal","rightRingProximal","rightRingIntermediate","rightRingDistal","rightLittleProximal","rightLittleIntermediate","rightLittleDistal"];var Bo={hips:null,spine:"hips",chest:"spine",upperChest:"chest",neck:"upperChest",head:"neck",leftEye:"head",rightEye:"head",jaw:"head",leftUpperLeg:"hips",leftLowerLeg:"leftUpperLeg",leftFoot:"leftLowerLeg",leftToes:"leftFoot",rightUpperLeg:"hips",rightLowerLeg:"rightUpperLeg",rightFoot:"rightLowerLeg",rightToes:"rightFoot",leftShoulder:"upperChest",leftUpperArm:"leftShoulder",leftLowerArm:"leftUpperArm",leftHand:"leftLowerArm",rightShoulder:"upperChest",rightUpperArm:"rightShoulder",rightLowerArm:"rightUpperArm",rightHand:"rightLowerArm",leftThumbMetacarpal:"leftHand",leftThumbProximal:"leftThumbMetacarpal",leftThumbDistal:"leftThumbProximal",leftIndexProximal:"leftHand",leftIndexIntermediate:"leftIndexProximal",leftIndexDistal:"leftIndexIntermediate",leftMiddleProximal:"leftHand",leftMiddleIntermediate:"leftMiddleProximal",leftMiddleDistal:"leftMiddleIntermediate",leftRingProximal:"leftHand",leftRingIntermediate:"leftRingProximal",leftRingDistal:"leftRingIntermediate",leftLittleProximal:"leftHand",leftLittleIntermediate:"leftLittleProximal",leftLittleDistal:"leftLittleIntermediate",rightThumbMetacarpal:"rightHand",rightThumbProximal:"rightThumbMetacarpal",rightThumbDistal:"rightThumbProximal",rightIndexProximal:"rightHand",rightIndexIntermediate:"rightIndexProximal",rightIndexDistal:"rightIndexIntermediate",rightMiddleProximal:"rightHand",rightMiddleIntermediate:"rightMiddleProximal",rightMiddleDistal:"rightMiddleIntermediate",rightRingProximal:"rightHand",rightRingIntermediate:"rightRingProximal",rightRingDistal:"rightRingIntermediate",rightLittleProximal:"rightHand",rightLittleIntermediate:"rightLittleProximal",rightLittleDistal:"rightLittleIntermediate"};function Si(t){return t.invert?t.invert():t.inverse(),t}var he=new x,pe=new S,dn=class{constructor(t){this.humanBones=t,this.restPose=this.getAbsolutePose()}getAbsolutePose(){let t={};return Object.keys(this.humanBones).forEach(e=>{let n=e,r=this.getBoneNode(n);r&&(he.copy(r.position),pe.copy(r.quaternion),t[n]={position:he.toArray(),rotation:pe.toArray()})}),t}getPose(){let t={};return Object.keys(this.humanBones).forEach(e=>{let n=e,r=this.getBoneNode(n);if(!r)return;he.set(0,0,0),pe.identity();let i=this.restPose[n];i?.position&&he.fromArray(i.position).negate(),i?.rotation&&Si(pe.fromArray(i.rotation)),he.add(r.position),pe.premultiply(r.quaternion),t[n]={position:he.toArray(),rotation:pe.toArray()}}),t}setPose(t){Object.entries(t).forEach(([e,n])=>{let r=e,i=this.getBoneNode(r);if(!i)return;let o=this.restPose[r];o&&(n?.position&&(i.position.fromArray(n.position),o.position&&i.position.add(he.fromArray(o.position))),n?.rotation&&(i.quaternion.fromArray(n.rotation),o.rotation&&i.quaternion.multiply(pe.fromArray(o.rotation))))})}resetPose(){Object.entries(this.restPose).forEach(([t,e])=>{let n=this.getBoneNode(t);n&&(e?.position&&n.position.fromArray(e.position),e?.rotation&&n.quaternion.fromArray(e.rotation))})}getBone(t){var e;return(e=this.humanBones[t])!=null?e:void 0}getBoneNode(t){var e,n;return(n=(e=this.humanBones[t])==null?void 0:e.node)!=null?n:null}},$t=new x,Oo=new S,Uo=new x,Xr=class wi extends dn{static _setupTransforms(e){let n=new q;n.name="VRMHumanoidRig";let r={},i={},o={},s={};Zt.forEach(a=>{var c;let h=e.getBoneNode(a);if(h){let d=new x,p=new S;h.updateWorldMatrix(!0,!1),h.matrixWorld.decompose(d,p,$t),r[a]=d,i[a]=p,o[a]=h.quaternion.clone();let f=new S;(c=h.parent)==null||c.matrixWorld.decompose($t,f,$t),s[a]=f}});let u={};return Zt.forEach(a=>{var c;let h=e.getBoneNode(a);if(h){let d=r[a],p=a,f;for(;f==null&&(p=Bo[p],p!=null);)f=r[p];let m=new q;m.name="Normalized_"+h.name,(p?(c=u[p])==null?void 0:c.node:n).add(m),m.position.copy(d),f&&m.position.sub(f),u[a]={node:m}}}),{rigBones:u,root:n,parentWorldRotations:s,boneRotations:o}}constructor(e){let{rigBones:n,root:r,parentWorldRotations:i,boneRotations:o}=wi._setupTransforms(e);super(n),this.original=e,this.root=r,this._parentWorldRotations=i,this._boneRotations=o}update(){Zt.forEach(e=>{let n=this.original.getBoneNode(e);if(n!=null){let r=this.getBoneNode(e),i=this._parentWorldRotations[e],o=Oo.copy(i).invert(),s=this._boneRotations[e];if(n.quaternion.copy(r.quaternion).multiply(i).premultiply(o).multiply(s),e==="hips"){let u=r.getWorldPosition(Uo);n.parent.updateWorldMatrix(!0,!1);let a=n.parent.matrixWorld,c=u.applyMatrix4(a.invert());n.position.copy(c)}}})}},qr=class Li{get restPose(){return console.warn("VRMHumanoid: restPose is deprecated. Use either rawRestPose or normalizedRestPose instead."),this.rawRestPose}get rawRestPose(){return this._rawHumanBones.restPose}get normalizedRestPose(){return this._normalizedHumanBones.restPose}get humanBones(){return this._rawHumanBones.humanBones}get rawHumanBones(){return this._rawHumanBones.humanBones}get normalizedHumanBones(){return this._normalizedHumanBones.humanBones}get normalizedHumanBonesRoot(){return this._normalizedHumanBones.root}constructor(e,n){var r;this.autoUpdateHumanBones=(r=n?.autoUpdateHumanBones)!=null?r:!0,this._rawHumanBones=new dn(e),this._normalizedHumanBones=new Xr(this._rawHumanBones)}copy(e){return this.autoUpdateHumanBones=e.autoUpdateHumanBones,this._rawHumanBones=new dn(e.humanBones),this._normalizedHumanBones=new Xr(this._rawHumanBones),this}clone(){return new Li(this.humanBones,{autoUpdateHumanBones:this.autoUpdateHumanBones}).copy(this)}getAbsolutePose(){return console.warn("VRMHumanoid: getAbsolutePose() is deprecated. Use either getRawAbsolutePose() or getNormalizedAbsolutePose() instead."),this.getRawAbsolutePose()}getRawAbsolutePose(){return this._rawHumanBones.getAbsolutePose()}getNormalizedAbsolutePose(){return this._normalizedHumanBones.getAbsolutePose()}getPose(){return console.warn("VRMHumanoid: getPose() is deprecated. Use either getRawPose() or getNormalizedPose() instead."),this.getRawPose()}getRawPose(){return this._rawHumanBones.getPose()}getNormalizedPose(){return this._normalizedHumanBones.getPose()}setPose(e){return console.warn("VRMHumanoid: setPose() is deprecated. Use either setRawPose() or setNormalizedPose() instead."),this.setRawPose(e)}setRawPose(e){return this._rawHumanBones.setPose(e)}setNormalizedPose(e){return this._normalizedHumanBones.setPose(e)}resetPose(){return console.warn("VRMHumanoid: resetPose() is deprecated. Use either resetRawPose() or resetNormalizedPose() instead."),this.resetRawPose()}resetRawPose(){return this._rawHumanBones.resetPose()}resetNormalizedPose(){return this._normalizedHumanBones.resetPose()}getBone(e){return console.warn("VRMHumanoid: getBone() is deprecated. Use either getRawBone() or getNormalizedBone() instead."),this.getRawBone(e)}getRawBone(e){return this._rawHumanBones.getBone(e)}getNormalizedBone(e){return this._normalizedHumanBones.getBone(e)}getBoneNode(e){return console.warn("VRMHumanoid: getBoneNode() is deprecated. Use either getRawBoneNode() or getNormalizedBoneNode() instead."),this.getRawBoneNode(e)}getRawBoneNode(e){return this._rawHumanBones.getBoneNode(e)}getNormalizedBoneNode(e){return this._normalizedHumanBones.getBoneNode(e)}update(){this.autoUpdateHumanBones&&this._normalizedHumanBones.update()}},Do={Hips:"hips",Spine:"spine",Head:"head",LeftUpperLeg:"leftUpperLeg",LeftLowerLeg:"leftLowerLeg",LeftFoot:"leftFoot",RightUpperLeg:"rightUpperLeg",RightLowerLeg:"rightLowerLeg",RightFoot:"rightFoot",LeftUpperArm:"leftUpperArm",LeftLowerArm:"leftLowerArm",LeftHand:"leftHand",RightUpperArm:"rightUpperArm",RightLowerArm:"rightLowerArm",RightHand:"rightHand"},Fo=new Set(["1.0","1.0-beta"]),Qr={leftThumbProximal:"leftThumbMetacarpal",leftThumbIntermediate:"leftThumbProximal",rightThumbProximal:"rightThumbMetacarpal",rightThumbIntermediate:"rightThumbProximal"},Vo=class{get name(){return"VRMHumanoidLoaderPlugin"}constructor(t,e){this.parser=t,this.helperRoot=e?.helperRoot,this.autoUpdateHumanBones=e?.autoUpdateHumanBones}afterRoot(t){return P(this,null,function*(){t.userData.vrmHumanoid=yield this._import(t)})}_import(t){return P(this,null,function*(){let e=yield this._v1Import(t);if(e)return e;let n=yield this._v0Import(t);return n||null})}_v1Import(t){return P(this,null,function*(){var e,n;let r=this.parser.json;if(!(((e=r.extensionsUsed)==null?void 0:e.indexOf("VRMC_vrm"))!==-1))return null;let o=(n=r.extensions)==null?void 0:n.VRMC_vrm;if(!o)return null;let s=o.specVersion;if(!Fo.has(s))return console.warn(`VRMHumanoidLoaderPlugin: Unknown VRMC_vrm specVersion "${s}"`),null;let u=o.humanoid;if(!u)return null;let a=u.humanBones.leftThumbIntermediate!=null||u.humanBones.rightThumbIntermediate!=null,c={};u.humanBones!=null&&(yield Promise.all(Object.entries(u.humanBones).map(d=>P(this,[d],function*([p,f]){let m=p,g=f.node;if(a){let T=Qr[m];T!=null&&(m=T)}let _=yield this.parser.getDependency("node",g);if(_==null){console.warn(`A glTF node bound to the humanoid bone ${m} (index = ${g}) does not exist`);return}c[m]={node:_}}))));let h=new qr(this._ensureRequiredBonesExist(c),{autoUpdateHumanBones:this.autoUpdateHumanBones});if(t.scene.add(h.normalizedHumanBonesRoot),this.helperRoot){let d=new jr(h);this.helperRoot.add(d),d.renderOrder=this.helperRoot.renderOrder}return h})}_v0Import(t){return P(this,null,function*(){var e;let r=(e=this.parser.json.extensions)==null?void 0:e.VRM;if(!r)return null;let i=r.humanoid;if(!i)return null;let o={};i.humanBones!=null&&(yield Promise.all(i.humanBones.map(u=>P(this,null,function*(){let a=u.bone,c=u.node;if(a==null||c==null)return;if(c<0){console.warn(`A glTF node index for the humanoid bone ${a} is negative (${c}), ignoring this bone.`);return}let h=yield this.parser.getDependency("node",c);if(h==null){console.warn(`A glTF node bound to the humanoid bone ${a} (index = ${c}) does not exist`);return}let d=Qr[a],p=d??a;if(o[p]!=null){console.warn(`Multiple bone entries for ${p} detected (index = ${c}), ignoring duplicated entries.`);return}o[p]={node:h}}))));let s=new qr(this._ensureRequiredBonesExist(o),{autoUpdateHumanBones:this.autoUpdateHumanBones});if(t.scene.add(s.normalizedHumanBonesRoot),this.helperRoot){let u=new jr(s);this.helperRoot.add(u),u.renderOrder=this.helperRoot.renderOrder}return s})}_ensureRequiredBonesExist(t){let e=Object.values(Do).filter(n=>t[n]==null);if(e.length>0)throw new Error(`VRMHumanoidLoaderPlugin: These humanoid bones are required but not exist: ${e.join(", ")}`);return t}},Yr=class extends U{constructor(){super(),this._currentTheta=0,this._currentRadius=0,this.theta=0,this.radius=0,this._currentTheta=0,this._currentRadius=0,this._attrPos=new I(new Float32Array(195),3),this.setAttribute("position",this._attrPos),this._attrIndex=new I(new Uint16Array(189),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let t=!1;this._currentTheta!==this.theta&&(this._currentTheta=this.theta,t=!0),this._currentRadius!==this.radius&&(this._currentRadius=this.radius,t=!0),t&&this._buildPosition()}_buildPosition(){this._attrPos.setXYZ(0,0,0,0);for(let t=0;t<64;t++){let e=t/63*this._currentTheta;this._attrPos.setXYZ(t+1,this._currentRadius*Math.sin(e),0,this._currentRadius*Math.cos(e))}this._attrPos.needsUpdate=!0}_buildIndex(){for(let t=0;t<63;t++)this._attrIndex.setXYZ(t*3,0,t+1,t+2);this._attrIndex.needsUpdate=!0}},ko=class extends U{constructor(){super(),this.radius=0,this._currentRadius=0,this.tail=new x,this._currentTail=new x,this._attrPos=new I(new Float32Array(294),3),this.setAttribute("position",this._attrPos),this._attrIndex=new I(new Uint16Array(194),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let t=!1;this._currentRadius!==this.radius&&(this._currentRadius=this.radius,t=!0),this._currentTail.equals(this.tail)||(this._currentTail.copy(this.tail),t=!0),t&&this._buildPosition()}_buildPosition(){for(let t=0;t<32;t++){let e=t/16*Math.PI;this._attrPos.setXYZ(t,Math.cos(e),Math.sin(e),0),this._attrPos.setXYZ(32+t,0,Math.cos(e),Math.sin(e)),this._attrPos.setXYZ(64+t,Math.sin(e),0,Math.cos(e))}this.scale(this._currentRadius,this._currentRadius,this._currentRadius),this.translate(this._currentTail.x,this._currentTail.y,this._currentTail.z),this._attrPos.setXYZ(96,0,0,0),this._attrPos.setXYZ(97,this._currentTail.x,this._currentTail.y,this._currentTail.z),this._attrPos.needsUpdate=!0}_buildIndex(){for(let t=0;t<32;t++){let e=(t+1)%32;this._attrIndex.setXY(t*2,t,e),this._attrIndex.setXY(64+t*2,32+t,32+e),this._attrIndex.setXY(128+t*2,64+t,64+e)}this._attrIndex.setXY(192,96,97),this._attrIndex.needsUpdate=!0}},Je=new S,Kr=new S,Ue=new x,Zr=new x,$r=Math.sqrt(2)/2,Go=new S(0,0,-$r,$r),Wo=new x(0,1,0),zo=class extends V{constructor(t){super(),this.matrixAutoUpdate=!1,this.vrmLookAt=t;{let e=new Yr;e.radius=.5;let n=new ee({color:65280,transparent:!0,opacity:.5,side:Ce,depthTest:!1,depthWrite:!1});this._meshPitch=new He(e,n),this.add(this._meshPitch)}{let e=new Yr;e.radius=.5;let n=new ee({color:16711680,transparent:!0,opacity:.5,side:Ce,depthTest:!1,depthWrite:!1});this._meshYaw=new He(e,n),this.add(this._meshYaw)}{let e=new ko;e.radius=.1;let n=new X({color:16777215,depthTest:!1,depthWrite:!1});this._lineTarget=new re(e,n),this._lineTarget.frustumCulled=!1,this.add(this._lineTarget)}}dispose(){this._meshYaw.geometry.dispose(),this._meshYaw.material.dispose(),this._meshPitch.geometry.dispose(),this._meshPitch.material.dispose(),this._lineTarget.geometry.dispose(),this._lineTarget.material.dispose()}updateMatrixWorld(t){let e=N.DEG2RAD*this.vrmLookAt.yaw;this._meshYaw.geometry.theta=e,this._meshYaw.geometry.update();let n=N.DEG2RAD*this.vrmLookAt.pitch;this._meshPitch.geometry.theta=n,this._meshPitch.geometry.update(),this.vrmLookAt.getLookAtWorldPosition(Ue),this.vrmLookAt.getLookAtWorldQuaternion(Je),Je.multiply(this.vrmLookAt.getFaceFrontQuaternion(Kr)),this._meshYaw.position.copy(Ue),this._meshYaw.quaternion.copy(Je),this._meshPitch.position.copy(Ue),this._meshPitch.quaternion.copy(Je),this._meshPitch.quaternion.multiply(Kr.setFromAxisAngle(Wo,e)),this._meshPitch.quaternion.multiply(Go);let{target:r,autoUpdate:i}=this.vrmLookAt;r!=null&&i&&(r.getWorldPosition(Zr).sub(Ue),this._lineTarget.geometry.tail.copy(Zr),this._lineTarget.geometry.update(),this._lineTarget.position.copy(Ue)),super.updateMatrixWorld(t)}},jo=new x,Xo=new x;function hn(t,e){return t.matrixWorld.decompose(jo,e,Xo),e}function nt(t){return[Math.atan2(-t.z,t.x),Math.atan2(t.y,Math.sqrt(t.x*t.x+t.z*t.z))]}function Jr(t){let e=Math.round(t/2/Math.PI);return t-2*Math.PI*e}var ei=new x(0,0,1),qo=new x,Qo=new x,Yo=new x,Ko=new S,Jt=new S,ti=new S,Zo=new S,en=new Ie,bi=class Pi{constructor(e,n){this.offsetFromHeadBone=new x,this.autoUpdate=!0,this.faceFront=new x(0,0,1),this.humanoid=e,this.applier=n,this._yaw=0,this._pitch=0,this._needsUpdate=!0,this._restHeadWorldQuaternion=this.getLookAtWorldQuaternion(new S)}get yaw(){return this._yaw}set yaw(e){this._yaw=e,this._needsUpdate=!0}get pitch(){return this._pitch}set pitch(e){this._pitch=e,this._needsUpdate=!0}get euler(){return console.warn("VRMLookAt: euler is deprecated. use getEuler() instead."),this.getEuler(new Ie)}getEuler(e){return e.set(N.DEG2RAD*this._pitch,N.DEG2RAD*this._yaw,0,"YXZ")}copy(e){if(this.humanoid!==e.humanoid)throw new Error("VRMLookAt: humanoid must be same in order to copy");return this.offsetFromHeadBone.copy(e.offsetFromHeadBone),this.applier=e.applier,this.autoUpdate=e.autoUpdate,this.target=e.target,this.faceFront.copy(e.faceFront),this}clone(){return new Pi(this.humanoid,this.applier).copy(this)}reset(){this._yaw=0,this._pitch=0,this._needsUpdate=!0}getLookAtWorldPosition(e){let n=this.humanoid.getRawBoneNode("head");return e.copy(this.offsetFromHeadBone).applyMatrix4(n.matrixWorld)}getLookAtWorldQuaternion(e){let n=this.humanoid.getRawBoneNode("head");return hn(n,e)}getFaceFrontQuaternion(e){if(this.faceFront.distanceToSquared(ei)<.01)return e.copy(this._restHeadWorldQuaternion).invert();let[n,r]=nt(this.faceFront);return en.set(0,.5*Math.PI+n,r,"YZX"),e.setFromEuler(en).premultiply(Zo.copy(this._restHeadWorldQuaternion).invert())}getLookAtWorldDirection(e){return this.getLookAtWorldQuaternion(Jt),this.getFaceFrontQuaternion(ti),e.copy(ei).applyQuaternion(Jt).applyQuaternion(ti).applyEuler(this.getEuler(en))}lookAt(e){let n=Ko.copy(this._restHeadWorldQuaternion).multiply(Si(this.getLookAtWorldQuaternion(Jt))),r=this.getLookAtWorldPosition(Qo),i=Yo.copy(e).sub(r).applyQuaternion(n).normalize(),[o,s]=nt(this.faceFront),[u,a]=nt(i),c=Jr(u-o),h=Jr(s-a);this._yaw=N.RAD2DEG*c,this._pitch=N.RAD2DEG*h,this._needsUpdate=!0}update(e){this.target!=null&&this.autoUpdate&&this.lookAt(this.target.getWorldPosition(qo)),this._needsUpdate&&(this._needsUpdate=!1,this.applier.applyYawPitch(this._yaw,this._pitch))}};bi.EULER_ORDER="YXZ";var $o=bi,Jo=new x(0,0,1),Y=new S,Re=new S,z=new Ie(0,0,0,"YXZ"),rt=class{constructor(t,e,n,r,i){this.humanoid=t,this.rangeMapHorizontalInner=e,this.rangeMapHorizontalOuter=n,this.rangeMapVerticalDown=r,this.rangeMapVerticalUp=i,this.faceFront=new x(0,0,1),this._restQuatLeftEye=new S,this._restQuatRightEye=new S,this._restLeftEyeParentWorldQuat=new S,this._restRightEyeParentWorldQuat=new S;let o=this.humanoid.getRawBoneNode("leftEye"),s=this.humanoid.getRawBoneNode("rightEye");o&&(this._restQuatLeftEye.copy(o.quaternion),hn(o.parent,this._restLeftEyeParentWorldQuat)),s&&(this._restQuatRightEye.copy(s.quaternion),hn(s.parent,this._restRightEyeParentWorldQuat))}applyYawPitch(t,e){let n=this.humanoid.getRawBoneNode("leftEye"),r=this.humanoid.getRawBoneNode("rightEye"),i=this.humanoid.getNormalizedBoneNode("leftEye"),o=this.humanoid.getNormalizedBoneNode("rightEye");n&&(e<0?z.x=-N.DEG2RAD*this.rangeMapVerticalDown.map(-e):z.x=N.DEG2RAD*this.rangeMapVerticalUp.map(e),t<0?z.y=-N.DEG2RAD*this.rangeMapHorizontalInner.map(-t):z.y=N.DEG2RAD*this.rangeMapHorizontalOuter.map(t),Y.setFromEuler(z),this._getWorldFaceFrontQuat(Re),i.quaternion.copy(Re).multiply(Y).multiply(Re.invert()),Y.copy(this._restLeftEyeParentWorldQuat),n.quaternion.copy(i.quaternion).multiply(Y).premultiply(Y.invert()).multiply(this._restQuatLeftEye)),r&&(e<0?z.x=-N.DEG2RAD*this.rangeMapVerticalDown.map(-e):z.x=N.DEG2RAD*this.rangeMapVerticalUp.map(e),t<0?z.y=-N.DEG2RAD*this.rangeMapHorizontalOuter.map(-t):z.y=N.DEG2RAD*this.rangeMapHorizontalInner.map(t),Y.setFromEuler(z),this._getWorldFaceFrontQuat(Re),o.quaternion.copy(Re).multiply(Y).multiply(Re.invert()),Y.copy(this._restRightEyeParentWorldQuat),r.quaternion.copy(o.quaternion).multiply(Y).premultiply(Y.invert()).multiply(this._restQuatRightEye))}lookAt(t){console.warn("VRMLookAtBoneApplier: lookAt() is deprecated. use apply() instead.");let e=N.RAD2DEG*t.y,n=N.RAD2DEG*t.x;this.applyYawPitch(e,n)}_getWorldFaceFrontQuat(t){if(this.faceFront.distanceToSquared(Jo)<.01)return t.identity();let[e,n]=nt(this.faceFront);return z.set(0,.5*Math.PI+e,n,"YZX"),t.setFromEuler(z)}};rt.type="bone";var pn=class{constructor(t,e,n,r,i){this.expressions=t,this.rangeMapHorizontalInner=e,this.rangeMapHorizontalOuter=n,this.rangeMapVerticalDown=r,this.rangeMapVerticalUp=i}applyYawPitch(t,e){e<0?(this.expressions.setValue("lookDown",0),this.expressions.setValue("lookUp",this.rangeMapVerticalUp.map(-e))):(this.expressions.setValue("lookUp",0),this.expressions.setValue("lookDown",this.rangeMapVerticalDown.map(e))),t<0?(this.expressions.setValue("lookLeft",0),this.expressions.setValue("lookRight",this.rangeMapHorizontalOuter.map(-t))):(this.expressions.setValue("lookRight",0),this.expressions.setValue("lookLeft",this.rangeMapHorizontalOuter.map(t)))}lookAt(t){console.warn("VRMLookAtBoneApplier: lookAt() is deprecated. use apply() instead.");let e=N.RAD2DEG*t.y,n=N.RAD2DEG*t.x;this.applyYawPitch(e,n)}};pn.type="expression";var ni=class{constructor(t,e){this.inputMaxValue=t,this.outputScale=e}map(t){return this.outputScale*xi(t/this.inputMaxValue)}},es=new Set(["1.0","1.0-beta"]),et=.01,ts=class{get name(){return"VRMLookAtLoaderPlugin"}constructor(t,e){this.parser=t,this.helperRoot=e?.helperRoot}afterRoot(t){return P(this,null,function*(){let e=t.userData.vrmHumanoid;if(e===null)return;if(e===void 0)throw new Error("VRMLookAtLoaderPlugin: vrmHumanoid is undefined. VRMHumanoidLoaderPlugin have to be used first");let n=t.userData.vrmExpressionManager;if(n!==null){if(n===void 0)throw new Error("VRMLookAtLoaderPlugin: vrmExpressionManager is undefined. VRMExpressionLoaderPlugin have to be used first");t.userData.vrmLookAt=yield this._import(t,e,n)}})}_import(t,e,n){return P(this,null,function*(){if(e==null||n==null)return null;let r=yield this._v1Import(t,e,n);if(r)return r;let i=yield this._v0Import(t,e,n);return i||null})}_v1Import(t,e,n){return P(this,null,function*(){var r,i,o;let s=this.parser.json;if(!(((r=s.extensionsUsed)==null?void 0:r.indexOf("VRMC_vrm"))!==-1))return null;let a=(i=s.extensions)==null?void 0:i.VRMC_vrm;if(!a)return null;let c=a.specVersion;if(!es.has(c))return console.warn(`VRMLookAtLoaderPlugin: Unknown VRMC_vrm specVersion "${c}"`),null;let h=a.lookAt;if(!h)return null;let d=h.type==="expression"?1:10,p=this._v1ImportRangeMap(h.rangeMapHorizontalInner,d),f=this._v1ImportRangeMap(h.rangeMapHorizontalOuter,d),m=this._v1ImportRangeMap(h.rangeMapVerticalDown,d),g=this._v1ImportRangeMap(h.rangeMapVerticalUp,d),_;h.type==="expression"?_=new pn(n,p,f,m,g):_=new rt(e,p,f,m,g);let T=this._importLookAt(e,_);return T.offsetFromHeadBone.fromArray((o=h.offsetFromHeadBone)!=null?o:[0,.06,0]),T})}_v1ImportRangeMap(t,e){var n,r;let i=(n=t?.inputMaxValue)!=null?n:90,o=(r=t?.outputScale)!=null?r:e;return i<et&&(console.warn("VRMLookAtLoaderPlugin: inputMaxValue of a range map is too small. Consider reviewing the range map!"),i=et),new ni(i,o)}_v0Import(t,e,n){return P(this,null,function*(){var r,i,o,s;let a=(r=this.parser.json.extensions)==null?void 0:r.VRM;if(!a)return null;let c=a.firstPerson;if(!c)return null;let h=c.lookAtTypeName==="BlendShape"?1:10,d=this._v0ImportDegreeMap(c.lookAtHorizontalInner,h),p=this._v0ImportDegreeMap(c.lookAtHorizontalOuter,h),f=this._v0ImportDegreeMap(c.lookAtVerticalDown,h),m=this._v0ImportDegreeMap(c.lookAtVerticalUp,h),g;c.lookAtTypeName==="BlendShape"?g=new pn(n,d,p,f,m):g=new rt(e,d,p,f,m);let _=this._importLookAt(e,g);return c.firstPersonBoneOffset?_.offsetFromHeadBone.set((i=c.firstPersonBoneOffset.x)!=null?i:0,(o=c.firstPersonBoneOffset.y)!=null?o:.06,-((s=c.firstPersonBoneOffset.z)!=null?s:0)):_.offsetFromHeadBone.set(0,.06,0),_.faceFront.set(0,0,-1),g instanceof rt&&g.faceFront.set(0,0,-1),_})}_v0ImportDegreeMap(t,e){var n,r;let i=t?.curve;JSON.stringify(i)!=="[0,0,0,1,1,1,1,0]"&&console.warn("Curves of LookAtDegreeMap defined in VRM 0.0 are not supported");let o=(n=t?.xRange)!=null?n:90,s=(r=t?.yRange)!=null?r:e;return o<et&&(console.warn("VRMLookAtLoaderPlugin: xRange of a degree map is too small. Consider reviewing the degree map!"),o=et),new ni(o,s)}_importLookAt(t,e){let n=new $o(t,e);if(this.helperRoot){let r=new zo(n);this.helperRoot.add(r),r.renderOrder=this.helperRoot.renderOrder}return n}};function ns(t,e){return typeof t!="string"||t===""?"":(/^https?:\/\//i.test(e)&&/^\//.test(t)&&(e=e.replace(/(^https?:\/\/[^/]+).*/i,"$1")),/^(https?:)?\/\//i.test(t)||/^data:.*,.*$/i.test(t)||/^blob:.*$/i.test(t)?t:e+t)}var rs=new Set(["1.0","1.0-beta"]),is=class{get name(){return"VRMMetaLoaderPlugin"}constructor(t,e){var n,r,i;this.parser=t,this.needThumbnailImage=(n=e?.needThumbnailImage)!=null?n:!1,this.acceptLicenseUrls=(r=e?.acceptLicenseUrls)!=null?r:["https://vrm.dev/licenses/1.0/"],this.acceptV0Meta=(i=e?.acceptV0Meta)!=null?i:!0}afterRoot(t){return P(this,null,function*(){t.userData.vrmMeta=yield this._import(t)})}_import(t){return P(this,null,function*(){let e=yield this._v1Import(t);if(e!=null)return e;let n=yield this._v0Import(t);return n??null})}_v1Import(t){return P(this,null,function*(){var e,n,r;let i=this.parser.json;if(!(((e=i.extensionsUsed)==null?void 0:e.indexOf("VRMC_vrm"))!==-1))return null;let s=(n=i.extensions)==null?void 0:n.VRMC_vrm;if(s==null)return null;let u=s.specVersion;if(!rs.has(u))return console.warn(`VRMMetaLoaderPlugin: Unknown VRMC_vrm specVersion "${u}"`),null;let a=s.meta;if(!a)return null;let c=a.licenseUrl;if(!new Set(this.acceptLicenseUrls).has(c))throw new Error(`VRMMetaLoaderPlugin: The license url "${c}" is not accepted`);let d;return this.needThumbnailImage&&a.thumbnailImage!=null&&(d=(r=yield this._extractGLTFImage(a.thumbnailImage))!=null?r:void 0),{metaVersion:"1",name:a.name,version:a.version,authors:a.authors,copyrightInformation:a.copyrightInformation,contactInformation:a.contactInformation,references:a.references,thirdPartyLicenses:a.thirdPartyLicenses,thumbnailImage:d,licenseUrl:a.licenseUrl,avatarPermission:a.avatarPermission,allowExcessivelyViolentUsage:a.allowExcessivelyViolentUsage,allowExcessivelySexualUsage:a.allowExcessivelySexualUsage,commercialUsage:a.commercialUsage,allowPoliticalOrReligiousUsage:a.allowPoliticalOrReligiousUsage,allowAntisocialOrHateUsage:a.allowAntisocialOrHateUsage,creditNotation:a.creditNotation,allowRedistribution:a.allowRedistribution,modification:a.modification,otherLicenseUrl:a.otherLicenseUrl}})}_v0Import(t){return P(this,null,function*(){var e;let r=(e=this.parser.json.extensions)==null?void 0:e.VRM;if(!r)return null;let i=r.meta;if(!i)return null;if(!this.acceptV0Meta)throw new Error("VRMMetaLoaderPlugin: Attempted to load VRM0.0 meta but acceptV0Meta is false");let o;return this.needThumbnailImage&&i.texture!=null&&i.texture!==-1&&(o=yield this.parser.getDependency("texture",i.texture)),{metaVersion:"0",allowedUserName:i.allowedUserName,author:i.author,commercialUssageName:i.commercialUssageName,contactInformation:i.contactInformation,licenseName:i.licenseName,otherLicenseUrl:i.otherLicenseUrl,otherPermissionUrl:i.otherPermissionUrl,reference:i.reference,sexualUssageName:i.sexualUssageName,texture:o??void 0,title:i.title,version:i.version,violentUssageName:i.violentUssageName}})}_extractGLTFImage(t){return P(this,null,function*(){var e;let r=(e=this.parser.json.images)==null?void 0:e[t];if(r==null)return console.warn(`VRMMetaLoaderPlugin: Attempt to use images[${t}] of glTF as a thumbnail but the image doesn't exist`),null;let i=r.uri;if(r.bufferView!=null){let s=yield this.parser.getDependency("bufferView",r.bufferView),u=new Blob([s],{type:r.mimeType});i=URL.createObjectURL(u)}return i==null?(console.warn(`VRMMetaLoaderPlugin: Attempt to use images[${t}] of glTF as a thumbnail but the image couldn't load properly`),null):yield new sr().loadAsync(ns(i,this.parser.options.path)).catch(s=>(console.error(s),console.warn("VRMMetaLoaderPlugin: Failed to load a thumbnail image"),null))})}},os=class{constructor(t){this.scene=t.scene,this.meta=t.meta,this.humanoid=t.humanoid,this.expressionManager=t.expressionManager,this.firstPerson=t.firstPerson,this.lookAt=t.lookAt}update(t){this.humanoid.update(),this.lookAt&&this.lookAt.update(t),this.expressionManager&&this.expressionManager.update()}};var ss=class extends os{constructor(t){super(t),this.materials=t.materials,this.springBoneManager=t.springBoneManager,this.nodeConstraintManager=t.nodeConstraintManager}update(t){super.update(t),this.nodeConstraintManager&&this.nodeConstraintManager.update(),this.springBoneManager&&this.springBoneManager.update(t),this.materials&&this.materials.forEach(e=>{e.update&&e.update(t)})}},as=Object.defineProperty,ri=Object.getOwnPropertySymbols,ls=Object.prototype.hasOwnProperty,us=Object.prototype.propertyIsEnumerable,ii=(t,e,n)=>e in t?as(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n,oi=(t,e)=>{for(var n in e||(e={}))ls.call(e,n)&&ii(t,n,e[n]);if(ri)for(var n of ri(e))us.call(e,n)&&ii(t,n,e[n]);return t},me=(t,e,n)=>new Promise((r,i)=>{var o=a=>{try{u(n.next(a))}catch(c){i(c)}},s=a=>{try{u(n.throw(a))}catch(c){i(c)}},u=a=>a.done?r(a.value):Promise.resolve(a.value).then(o,s);u((n=n.apply(t,e)).next())}),cs={"":3e3,srgb:3001};function ds(t,e){parseInt(ce,10)>=152?t.colorSpace=e:t.encoding=cs[e]}var hs=class{get pending(){return Promise.all(this._pendings)}constructor(t,e){this._parser=t,this._materialParams=e,this._pendings=[]}assignPrimitive(t,e){e!=null&&(this._materialParams[t]=e)}assignColor(t,e,n){if(e!=null){let r=new O().fromArray(e);n&&r.convertSRGBToLinear(),this._materialParams[t]=r}}assignTexture(t,e,n){return me(this,null,function*(){let r=me(this,null,function*(){if(e!=null){let i=yield this._parser.assignTexture(this._materialParams,t,e);if(i==null){console.warn("GLTFMToonMaterialParamsAssignHelper: Failed to load texture. The rendering result may be wrong");return}n&&ds(i,"srgb")}});return this._pendings.push(r),r})}assignTextureByIndex(t,e,n){return me(this,null,function*(){return this.assignTexture(t,e!=null?{index:e}:void 0,n)})}},ps=`// #define PHONG

varying vec3 vViewPosition;

#ifndef FLAT_SHADED
  varying vec3 vNormal;
#endif

#include <common>

// #include <uv_pars_vertex>
#ifdef MTOON_USE_UV
  varying vec2 vUv;

  // COMPAT: pre-r151 uses a common uvTransform
  #if THREE_VRM_THREE_REVISION < 151
    uniform mat3 uvTransform;
  #endif
#endif

// #include <uv2_pars_vertex>
// COMAPT: pre-r151 uses uv2 for lightMap and aoMap
#if THREE_VRM_THREE_REVISION < 151
  #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
    attribute vec2 uv2;
    varying vec2 vUv2;
    uniform mat3 uv2Transform;
  #endif
#endif

// #include <displacementmap_pars_vertex>
// #include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef USE_OUTLINEWIDTHMULTIPLYTEXTURE
  uniform sampler2D outlineWidthMultiplyTexture;
  uniform mat3 outlineWidthMultiplyTextureUvTransform;
#endif

uniform float outlineWidthFactor;

void main() {

  // #include <uv_vertex>
  #ifdef MTOON_USE_UV
    // COMPAT: pre-r151 uses a common uvTransform
    #if THREE_VRM_THREE_REVISION >= 151
      vUv = uv;
    #else
      vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
    #endif
  #endif

  // #include <uv2_vertex>
  // COMAPT: pre-r151 uses uv2 for lightMap and aoMap
  #if THREE_VRM_THREE_REVISION < 151
    #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
      vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;
    #endif
  #endif

  #include <color_vertex>

  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>

  // we need this to compute the outline properly
  objectNormal = normalize( objectNormal );

  #include <defaultnormal_vertex>

  #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
    vNormal = normalize( transformedNormal );
  #endif

  #include <begin_vertex>

  #include <morphtarget_vertex>
  #include <skinning_vertex>
  // #include <displacementmap_vertex>
  #include <project_vertex>
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>

  vViewPosition = - mvPosition.xyz;

  #ifdef OUTLINE
    float worldNormalLength = length( transformedNormal );
    vec3 outlineOffset = outlineWidthFactor * worldNormalLength * objectNormal;

    #ifdef USE_OUTLINEWIDTHMULTIPLYTEXTURE
      vec2 outlineWidthMultiplyTextureUv = ( outlineWidthMultiplyTextureUvTransform * vec3( vUv, 1 ) ).xy;
      float outlineTex = texture2D( outlineWidthMultiplyTexture, outlineWidthMultiplyTextureUv ).g;
      outlineOffset *= outlineTex;
    #endif

    #ifdef OUTLINE_WIDTH_SCREEN
      outlineOffset *= vViewPosition.z / projectionMatrix[ 1 ].y;
    #endif

    gl_Position = projectionMatrix * modelViewMatrix * vec4( outlineOffset + transformed, 1.0 );

    gl_Position.z += 1E-6 * gl_Position.w; // anti-artifact magic
  #endif

  #include <worldpos_vertex>
  // #include <envmap_vertex>
  #include <shadowmap_vertex>
  #include <fog_vertex>

}`,fs=`// #define PHONG

uniform vec3 litFactor;

uniform float opacity;

uniform vec3 shadeColorFactor;
#ifdef USE_SHADEMULTIPLYTEXTURE
  uniform sampler2D shadeMultiplyTexture;
  uniform mat3 shadeMultiplyTextureUvTransform;
#endif

uniform float shadingShiftFactor;
uniform float shadingToonyFactor;

#ifdef USE_SHADINGSHIFTTEXTURE
  uniform sampler2D shadingShiftTexture;
  uniform mat3 shadingShiftTextureUvTransform;
  uniform float shadingShiftTextureScale;
#endif

uniform float giEqualizationFactor;

uniform vec3 parametricRimColorFactor;
#ifdef USE_RIMMULTIPLYTEXTURE
  uniform sampler2D rimMultiplyTexture;
  uniform mat3 rimMultiplyTextureUvTransform;
#endif
uniform float rimLightingMixFactor;
uniform float parametricRimFresnelPowerFactor;
uniform float parametricRimLiftFactor;

#ifdef USE_MATCAPTEXTURE
  uniform vec3 matcapFactor;
  uniform sampler2D matcapTexture;
  uniform mat3 matcapTextureUvTransform;
#endif

uniform vec3 emissive;
uniform float emissiveIntensity;

uniform vec3 outlineColorFactor;
uniform float outlineLightingMixFactor;

#ifdef USE_UVANIMATIONMASKTEXTURE
  uniform sampler2D uvAnimationMaskTexture;
  uniform mat3 uvAnimationMaskTextureUvTransform;
#endif

uniform float uvAnimationScrollXOffset;
uniform float uvAnimationScrollYOffset;
uniform float uvAnimationRotationPhase;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>

// #include <uv_pars_fragment>
#if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )
  varying vec2 vUv;
#endif

// #include <uv2_pars_fragment>
// COMAPT: pre-r151 uses uv2 for lightMap and aoMap
#if THREE_VRM_THREE_REVISION < 151
  #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
    varying vec2 vUv2;
  #endif
#endif

#include <map_pars_fragment>

#ifdef USE_MAP
  uniform mat3 mapUvTransform;
#endif

// #include <alphamap_pars_fragment>

#include <alphatest_pars_fragment>

#include <aomap_pars_fragment>
// #include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>

#ifdef USE_EMISSIVEMAP
  uniform mat3 emissiveMapUvTransform;
#endif

// #include <envmap_common_pars_fragment>
// #include <envmap_pars_fragment>
// #include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>

// #include <bsdfs>
// COMPAT: pre-r151 doesn't have BRDF_Lambert in <common>
#if THREE_VRM_THREE_REVISION < 151
  vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
    return RECIPROCAL_PI * diffuseColor;
  }
#endif

#include <lights_pars_begin>

#include <normal_pars_fragment>

// #include <lights_phong_pars_fragment>
varying vec3 vViewPosition;

struct MToonMaterial {
  vec3 diffuseColor;
  vec3 shadeColor;
  float shadingShift;
};

float linearstep( float a, float b, float t ) {
  return clamp( ( t - a ) / ( b - a ), 0.0, 1.0 );
}

/**
 * Convert NdotL into toon shading factor using shadingShift and shadingToony
 */
float getShading(
  const in float dotNL,
  const in float shadow,
  const in float shadingShift
) {
  float shading = dotNL;
  shading = shading + shadingShift;
  shading = linearstep( -1.0 + shadingToonyFactor, 1.0 - shadingToonyFactor, shading );
  shading *= shadow;
  return shading;
}

/**
 * Mix diffuseColor and shadeColor using shading factor and light color
 */
vec3 getDiffuse(
  const in MToonMaterial material,
  const in float shading,
  in vec3 lightColor
) {
  #ifdef DEBUG_LITSHADERATE
    return vec3( BRDF_Lambert( shading * lightColor ) );
  #endif

  vec3 col = lightColor * BRDF_Lambert( mix( material.shadeColor, material.diffuseColor, shading ) );

  // The "comment out if you want to PBR absolutely" line
  #ifdef V0_COMPAT_SHADE
    col = min( col, material.diffuseColor );
  #endif

  return col;
}

// COMPAT: pre-r156 uses a struct GeometricContext
#if THREE_VRM_THREE_REVISION >= 157
  void RE_Direct_MToon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in MToonMaterial material, const in float shadow, inout ReflectedLight reflectedLight ) {
    float dotNL = clamp( dot( geometryNormal, directLight.direction ), -1.0, 1.0 );
    vec3 irradiance = directLight.color;

    // directSpecular will be used for rim lighting, not an actual specular
    reflectedLight.directSpecular += irradiance;

    irradiance *= dotNL;

    float shading = getShading( dotNL, shadow, material.shadingShift );

    // toon shaded diffuse
    reflectedLight.directDiffuse += getDiffuse( material, shading, directLight.color );
  }

  void RE_IndirectDiffuse_MToon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in MToonMaterial material, inout ReflectedLight reflectedLight ) {
    // indirect diffuse will use diffuseColor, no shadeColor involved
    reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

    // directSpecular will be used for rim lighting, not an actual specular
    reflectedLight.directSpecular += irradiance;
  }
#else
  void RE_Direct_MToon( const in IncidentLight directLight, const in GeometricContext geometry, const in MToonMaterial material, const in float shadow, inout ReflectedLight reflectedLight ) {
    float dotNL = clamp( dot( geometry.normal, directLight.direction ), -1.0, 1.0 );
    vec3 irradiance = directLight.color;

    // directSpecular will be used for rim lighting, not an actual specular
    reflectedLight.directSpecular += irradiance;

    irradiance *= dotNL;

    float shading = getShading( dotNL, shadow, material.shadingShift );

    // toon shaded diffuse
    reflectedLight.directDiffuse += getDiffuse( material, shading, directLight.color );
  }

  void RE_IndirectDiffuse_MToon( const in vec3 irradiance, const in GeometricContext geometry, const in MToonMaterial material, inout ReflectedLight reflectedLight ) {
    // indirect diffuse will use diffuseColor, no shadeColor involved
    reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

    // directSpecular will be used for rim lighting, not an actual specular
    reflectedLight.directSpecular += irradiance;
  }
#endif

#define RE_Direct RE_Direct_MToon
#define RE_IndirectDiffuse RE_IndirectDiffuse_MToon
#define Material_LightProbeLOD( material ) (0)

#include <shadowmap_pars_fragment>
// #include <bumpmap_pars_fragment>

// #include <normalmap_pars_fragment>
#ifdef USE_NORMALMAP

  uniform sampler2D normalMap;
  uniform mat3 normalMapUvTransform;
  uniform vec2 normalScale;

#endif

// COMPAT: pre-r151
// USE_NORMALMAP_OBJECTSPACE used to be OBJECTSPACE_NORMALMAP in pre-r151
#if defined( USE_NORMALMAP_OBJECTSPACE ) || defined( OBJECTSPACE_NORMALMAP )

  uniform mat3 normalMatrix;

#endif

// COMPAT: pre-r151
// USE_NORMALMAP_TANGENTSPACE used to be TANGENTSPACE_NORMALMAP in pre-r151
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( TANGENTSPACE_NORMALMAP ) )

  // Per-Pixel Tangent Space Normal Mapping
  // http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html

  // three-vrm specific change: it requires \`uv\` as an input in order to support uv scrolls

  // Temporary compat against shader change @ Three.js r126, r151
  #if THREE_VRM_THREE_REVISION >= 151

    mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {

      vec3 q0 = dFdx( eye_pos.xyz );
      vec3 q1 = dFdy( eye_pos.xyz );
      vec2 st0 = dFdx( uv.st );
      vec2 st1 = dFdy( uv.st );

      vec3 N = surf_norm;

      vec3 q1perp = cross( q1, N );
      vec3 q0perp = cross( N, q0 );

      vec3 T = q1perp * st0.x + q0perp * st1.x;
      vec3 B = q1perp * st0.y + q0perp * st1.y;

      float det = max( dot( T, T ), dot( B, B ) );
      float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );

      return mat3( T * scale, B * scale, N );

    }

  #else

    vec3 perturbNormal2Arb( vec2 uv, vec3 eye_pos, vec3 surf_norm, vec3 mapN, float faceDirection ) {

      vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
      vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
      vec2 st0 = dFdx( uv.st );
      vec2 st1 = dFdy( uv.st );

      vec3 N = normalize( surf_norm );

      vec3 q1perp = cross( q1, N );
      vec3 q0perp = cross( N, q0 );

      vec3 T = q1perp * st0.x + q0perp * st1.x;
      vec3 B = q1perp * st0.y + q0perp * st1.y;

      // three-vrm specific change: Workaround for the issue that happens when delta of uv = 0.0
      // TODO: Is this still required? Or shall I make a PR about it?
      if ( length( T ) == 0.0 || length( B ) == 0.0 ) {
        return surf_norm;
      }

      float det = max( dot( T, T ), dot( B, B ) );
      float scale = ( det == 0.0 ) ? 0.0 : faceDirection * inversesqrt( det );

      return normalize( T * ( mapN.x * scale ) + B * ( mapN.y * scale ) + N * mapN.z );

    }

  #endif

#endif

// #include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

// == post correction ==========================================================
void postCorrection() {
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
  #include <premultiplied_alpha_fragment>
  #include <dithering_fragment>
}

// == main procedure ===========================================================
void main() {
  #include <clipping_planes_fragment>

  vec2 uv = vec2(0.5, 0.5);

  #if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )
    uv = vUv;

    float uvAnimMask = 1.0;
    #ifdef USE_UVANIMATIONMASKTEXTURE
      vec2 uvAnimationMaskTextureUv = ( uvAnimationMaskTextureUvTransform * vec3( uv, 1 ) ).xy;
      uvAnimMask = texture2D( uvAnimationMaskTexture, uvAnimationMaskTextureUv ).b;
    #endif

    float uvRotCos = cos( uvAnimationRotationPhase * uvAnimMask );
    float uvRotSin = sin( uvAnimationRotationPhase * uvAnimMask );
    uv = mat2( uvRotCos, -uvRotSin, uvRotSin, uvRotCos ) * ( uv - 0.5 ) + 0.5;
    uv = uv + vec2( uvAnimationScrollXOffset, uvAnimationScrollYOffset ) * uvAnimMask;
  #endif

  #ifdef DEBUG_UV
    gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
    #if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )
      gl_FragColor = vec4( uv, 0.0, 1.0 );
    #endif
    return;
  #endif

  vec4 diffuseColor = vec4( litFactor, opacity );
  ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
  vec3 totalEmissiveRadiance = emissive * emissiveIntensity;

  #include <logdepthbuf_fragment>

  // #include <map_fragment>
  #ifdef USE_MAP
    vec2 mapUv = ( mapUvTransform * vec3( uv, 1 ) ).xy;
    vec4 sampledDiffuseColor = texture2D( map, mapUv );
    #ifdef DECODE_VIDEO_TEXTURE
      sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
    #endif
    diffuseColor *= sampledDiffuseColor;
  #endif

  // #include <color_fragment>
  #if ( defined( USE_COLOR ) && !defined( IGNORE_VERTEX_COLOR ) )
    diffuseColor.rgb *= vColor;
  #endif

  // #include <alphamap_fragment>

  #include <alphatest_fragment>

  // #include <specularmap_fragment>

  // #include <normal_fragment_begin>
  float faceDirection = gl_FrontFacing ? 1.0 : -1.0;

  #ifdef FLAT_SHADED

    vec3 fdx = dFdx( vViewPosition );
    vec3 fdy = dFdy( vViewPosition );
    vec3 normal = normalize( cross( fdx, fdy ) );

  #else

    vec3 normal = normalize( vNormal );

    #ifdef DOUBLE_SIDED

      normal *= faceDirection;

    #endif

  #endif

  #ifdef USE_NORMALMAP

    vec2 normalMapUv = ( normalMapUvTransform * vec3( uv, 1 ) ).xy;

  #endif

  #ifdef USE_NORMALMAP_TANGENTSPACE

    #ifdef USE_TANGENT

      mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );

    #else

      mat3 tbn = getTangentFrame( - vViewPosition, normal, normalMapUv );

    #endif

    #if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )

      tbn[0] *= faceDirection;
      tbn[1] *= faceDirection;

    #endif

  #endif

  #ifdef USE_CLEARCOAT_NORMALMAP

    #ifdef USE_TANGENT

      mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );

    #else

      mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );

    #endif

    #if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )

      tbn2[0] *= faceDirection;
      tbn2[1] *= faceDirection;

    #endif

  #endif

  // non perturbed normal for clearcoat among others

  vec3 nonPerturbedNormal = normal;

  #ifdef OUTLINE
    normal *= -1.0;
  #endif

  // #include <normal_fragment_maps>

  // COMPAT: pre-r151
  // USE_NORMALMAP_OBJECTSPACE used to be OBJECTSPACE_NORMALMAP in pre-r151
  #if defined( USE_NORMALMAP_OBJECTSPACE ) || defined( OBJECTSPACE_NORMALMAP )

    normal = texture2D( normalMap, normalMapUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

    #ifdef FLIP_SIDED

      normal = - normal;

    #endif

    #ifdef DOUBLE_SIDED

      normal = normal * faceDirection;

    #endif

    normal = normalize( normalMatrix * normal );

  // COMPAT: pre-r151
  // USE_NORMALMAP_TANGENTSPACE used to be TANGENTSPACE_NORMALMAP in pre-r151
  #elif defined( USE_NORMALMAP_TANGENTSPACE ) || defined( TANGENTSPACE_NORMALMAP )

    vec3 mapN = texture2D( normalMap, normalMapUv ).xyz * 2.0 - 1.0;
    mapN.xy *= normalScale;

    // COMPAT: pre-r151
    #if THREE_VRM_THREE_REVISION >= 151 || defined( USE_TANGENT )

      normal = normalize( tbn * mapN );

    #else

      normal = perturbNormal2Arb( uv, -vViewPosition, normal, mapN, faceDirection );

    #endif

  #endif

  // #include <emissivemap_fragment>
  #ifdef USE_EMISSIVEMAP
    vec2 emissiveMapUv = ( emissiveMapUvTransform * vec3( uv, 1 ) ).xy;
    totalEmissiveRadiance *= texture2D( emissiveMap, emissiveMapUv ).rgb;
  #endif

  #ifdef DEBUG_NORMAL
    gl_FragColor = vec4( 0.5 + 0.5 * normal, 1.0 );
    return;
  #endif

  // -- MToon: lighting --------------------------------------------------------
  // accumulation
  // #include <lights_phong_fragment>
  MToonMaterial material;

  material.diffuseColor = diffuseColor.rgb;

  material.shadeColor = shadeColorFactor;
  #ifdef USE_SHADEMULTIPLYTEXTURE
    vec2 shadeMultiplyTextureUv = ( shadeMultiplyTextureUvTransform * vec3( uv, 1 ) ).xy;
    material.shadeColor *= texture2D( shadeMultiplyTexture, shadeMultiplyTextureUv ).rgb;
  #endif

  #if ( defined( USE_COLOR ) && !defined( IGNORE_VERTEX_COLOR ) )
    material.shadeColor.rgb *= vColor;
  #endif

  material.shadingShift = shadingShiftFactor;
  #ifdef USE_SHADINGSHIFTTEXTURE
    vec2 shadingShiftTextureUv = ( shadingShiftTextureUvTransform * vec3( uv, 1 ) ).xy;
    material.shadingShift += texture2D( shadingShiftTexture, shadingShiftTextureUv ).r * shadingShiftTextureScale;
  #endif

  // #include <lights_fragment_begin>

  // MToon Specific changes:
  // Since we want to take shadows into account of shading instead of irradiance,
  // we had to modify the codes that multiplies the results of shadowmap into color of direct lights.

  // COMPAT: pre-r156 uses a struct GeometricContext
  #if THREE_VRM_THREE_REVISION >= 157
    vec3 geometryPosition = - vViewPosition;
    vec3 geometryNormal = normal;
    vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );

    vec3 geometryClearcoatNormal;

    #ifdef USE_CLEARCOAT

      geometryClearcoatNormal = clearcoatNormal;

    #endif
  #else
    GeometricContext geometry;

    geometry.position = - vViewPosition;
    geometry.normal = normal;
    geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );

    #ifdef USE_CLEARCOAT

      geometry.clearcoatNormal = clearcoatNormal;

    #endif
  #endif

  IncidentLight directLight;

  // since these variables will be used in unrolled loop, we have to define in prior
  float shadow;

  #if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )

    PointLight pointLight;
    #if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
    PointLightShadow pointLightShadow;
    #endif

    #pragma unroll_loop_start
    for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

      pointLight = pointLights[ i ];

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        getPointLightInfo( pointLight, geometryPosition, directLight );
      #else
        getPointLightInfo( pointLight, geometry, directLight );
      #endif

      shadow = 1.0;
      #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
      pointLightShadow = pointLightShadows[ i ];
      // COMPAT: pre-r166
      // r166 introduced shadowIntensity
      #if THREE_VRM_THREE_REVISION >= 166
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
      #else
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
      #endif
      #endif

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );
      #else
        RE_Direct( directLight, geometry, material, shadow, reflectedLight );
      #endif

    }
    #pragma unroll_loop_end

  #endif

  #if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )

    SpotLight spotLight;
    // COMPAT: pre-r144 uses NUM_SPOT_LIGHT_SHADOWS, r144+ uses NUM_SPOT_LIGHT_COORDS
    #if THREE_VRM_THREE_REVISION >= 144
      #if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_COORDS > 0
      SpotLightShadow spotLightShadow;
      #endif
    #elif defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
    SpotLightShadow spotLightShadow;
    #endif

    #pragma unroll_loop_start
    for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {

      spotLight = spotLights[ i ];

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        getSpotLightInfo( spotLight, geometryPosition, directLight );
      #else
        getSpotLightInfo( spotLight, geometry, directLight );
      #endif

      shadow = 1.0;
      // COMPAT: pre-r144 uses NUM_SPOT_LIGHT_SHADOWS and vSpotShadowCoord, r144+ uses NUM_SPOT_LIGHT_COORDS and vSpotLightCoord
      // COMPAT: pre-r166 does not have shadowIntensity, r166+ has shadowIntensity
      #if THREE_VRM_THREE_REVISION >= 166
        #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_COORDS )
        spotLightShadow = spotLightShadows[ i ];
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
        #endif
      #elif THREE_VRM_THREE_REVISION >= 144
        #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_COORDS )
        spotLightShadow = spotLightShadows[ i ];
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
        #endif
      #elif defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
      spotLightShadow = spotLightShadows[ i ];
      shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
      #endif

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );
      #else
        RE_Direct( directLight, geometry, material, shadow, reflectedLight );
      #endif

    }
    #pragma unroll_loop_end

  #endif

  #if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )

    DirectionalLight directionalLight;
    #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
    DirectionalLightShadow directionalLightShadow;
    #endif

    #pragma unroll_loop_start
    for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

      directionalLight = directionalLights[ i ];

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        getDirectionalLightInfo( directionalLight, directLight );
      #else
        getDirectionalLightInfo( directionalLight, geometry, directLight );
      #endif

      shadow = 1.0;
      #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
      directionalLightShadow = directionalLightShadows[ i ];
      // COMPAT: pre-r166
      // r166 introduced shadowIntensity
      #if THREE_VRM_THREE_REVISION >= 166
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
      #else
        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
      #endif
      #endif

      // COMPAT: pre-r156 uses a struct GeometricContext
      #if THREE_VRM_THREE_REVISION >= 157
        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );
      #else
        RE_Direct( directLight, geometry, material, shadow, reflectedLight );
      #endif

    }
    #pragma unroll_loop_end

  #endif

  // #if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )

  //   RectAreaLight rectAreaLight;

  //   #pragma unroll_loop_start
  //   for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {

  //     rectAreaLight = rectAreaLights[ i ];
  //     RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );

  //   }
  //   #pragma unroll_loop_end

  // #endif

  #if defined( RE_IndirectDiffuse )

    vec3 iblIrradiance = vec3( 0.0 );

    vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );

    // COMPAT: pre-r156 uses a struct GeometricContext
    // COMPAT: pre-r156 doesn't have a define USE_LIGHT_PROBES
    #if THREE_VRM_THREE_REVISION >= 157
      #if defined( USE_LIGHT_PROBES )
        irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
      #endif
    #else
      irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );
    #endif

    #if ( NUM_HEMI_LIGHTS > 0 )

      #pragma unroll_loop_start
      for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {

        // COMPAT: pre-r156 uses a struct GeometricContext
        #if THREE_VRM_THREE_REVISION >= 157
          irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
        #else
          irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal );
        #endif

      }
      #pragma unroll_loop_end

    #endif

  #endif

  // #if defined( RE_IndirectSpecular )

  //   vec3 radiance = vec3( 0.0 );
  //   vec3 clearcoatRadiance = vec3( 0.0 );

  // #endif

  #include <lights_fragment_maps>
  #include <lights_fragment_end>

  // modulation
  #include <aomap_fragment>

  vec3 col = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;

  #ifdef DEBUG_LITSHADERATE
    gl_FragColor = vec4( col, diffuseColor.a );
    postCorrection();
    return;
  #endif

  // -- MToon: rim lighting -----------------------------------------
  vec3 viewDir = normalize( vViewPosition );

  #ifndef PHYSICALLY_CORRECT_LIGHTS
    reflectedLight.directSpecular /= PI;
  #endif
  vec3 rimMix = mix( vec3( 1.0 ), reflectedLight.directSpecular, rimLightingMixFactor );

  vec3 rim = parametricRimColorFactor * pow( saturate( 1.0 - dot( viewDir, normal ) + parametricRimLiftFactor ), parametricRimFresnelPowerFactor );

  #ifdef USE_MATCAPTEXTURE
    {
      vec3 x = normalize( vec3( viewDir.z, 0.0, -viewDir.x ) );
      vec3 y = cross( viewDir, x ); // guaranteed to be normalized
      vec2 sphereUv = 0.5 + 0.5 * vec2( dot( x, normal ), -dot( y, normal ) );
      sphereUv = ( matcapTextureUvTransform * vec3( sphereUv, 1 ) ).xy;
      vec3 matcap = texture2D( matcapTexture, sphereUv ).rgb;
      rim += matcapFactor * matcap;
    }
  #endif

  #ifdef USE_RIMMULTIPLYTEXTURE
    vec2 rimMultiplyTextureUv = ( rimMultiplyTextureUvTransform * vec3( uv, 1 ) ).xy;
    rim *= texture2D( rimMultiplyTexture, rimMultiplyTextureUv ).rgb;
  #endif

  col += rimMix * rim;

  // -- MToon: Emission --------------------------------------------------------
  col += totalEmissiveRadiance;

  // #include <envmap_fragment>

  // -- Almost done! -----------------------------------------------------------
  #if defined( OUTLINE )
    col = outlineColorFactor.rgb * mix( vec3( 1.0 ), col, outlineLightingMixFactor );
  #endif

  #ifdef OPAQUE
    diffuseColor.a = 1.0;
  #endif

  gl_FragColor = vec4( col, diffuseColor.a );
  postCorrection();
}
`,ms={None:"none",Normal:"normal",LitShadeRate:"litShadeRate",UV:"uv"},si={None:"none",WorldCoordinates:"worldCoordinates",ScreenCoordinates:"screenCoordinates"},gs={3e3:"",3001:"srgb"};function tn(t){return parseInt(ce,10)>=152?t.colorSpace:gs[t.encoding]}var _s=class extends Rr{constructor(t={}){var e;super({vertexShader:ps,fragmentShader:fs}),this.uvAnimationScrollXSpeedFactor=0,this.uvAnimationScrollYSpeedFactor=0,this.uvAnimationRotationSpeedFactor=0,this.fog=!0,this.normalMapType=Sr,this._ignoreVertexColor=!0,this._v0CompatShade=!1,this._debugMode=ms.None,this._outlineWidthMode=si.None,this._isOutline=!1,t.transparentWithZWrite&&(t.depthWrite=!0),delete t.transparentWithZWrite,t.fog=!0,t.lights=!0,t.clipping=!0,this.uniforms=br.merge([Ee.common,Ee.normalmap,Ee.emissivemap,Ee.fog,Ee.lights,{litFactor:{value:new O(1,1,1)},mapUvTransform:{value:new G},colorAlpha:{value:1},normalMapUvTransform:{value:new G},shadeColorFactor:{value:new O(0,0,0)},shadeMultiplyTexture:{value:null},shadeMultiplyTextureUvTransform:{value:new G},shadingShiftFactor:{value:0},shadingShiftTexture:{value:null},shadingShiftTextureUvTransform:{value:new G},shadingShiftTextureScale:{value:1},shadingToonyFactor:{value:.9},giEqualizationFactor:{value:.9},matcapFactor:{value:new O(1,1,1)},matcapTexture:{value:null},matcapTextureUvTransform:{value:new G},parametricRimColorFactor:{value:new O(0,0,0)},rimMultiplyTexture:{value:null},rimMultiplyTextureUvTransform:{value:new G},rimLightingMixFactor:{value:1},parametricRimFresnelPowerFactor:{value:5},parametricRimLiftFactor:{value:0},emissive:{value:new O(0,0,0)},emissiveIntensity:{value:1},emissiveMapUvTransform:{value:new G},outlineWidthMultiplyTexture:{value:null},outlineWidthMultiplyTextureUvTransform:{value:new G},outlineWidthFactor:{value:0},outlineColorFactor:{value:new O(0,0,0)},outlineLightingMixFactor:{value:1},uvAnimationMaskTexture:{value:null},uvAnimationMaskTextureUvTransform:{value:new G},uvAnimationScrollXOffset:{value:0},uvAnimationScrollYOffset:{value:0},uvAnimationRotationPhase:{value:0}},(e=t.uniforms)!=null?e:{}]),this.setValues(t),this._uploadUniformsWorkaround(),this.customProgramCacheKey=()=>[...Object.entries(this._generateDefines()).map(([n,r])=>`${n}:${r}`),this.matcapTexture?`matcapTextureColorSpace:${tn(this.matcapTexture)}`:"",this.shadeMultiplyTexture?`shadeMultiplyTextureColorSpace:${tn(this.shadeMultiplyTexture)}`:"",this.rimMultiplyTexture?`rimMultiplyTextureColorSpace:${tn(this.rimMultiplyTexture)}`:""].join(","),this.onBeforeCompile=n=>{let r=parseInt(ce,10),i=Object.entries(oi(oi({},this._generateDefines()),this.defines)).filter(([o,s])=>!!s).map(([o,s])=>`#define ${o} ${s}`).join(`
`)+`
`;n.vertexShader=i+n.vertexShader,n.fragmentShader=i+n.fragmentShader,r<154&&(n.fragmentShader=n.fragmentShader.replace("#include <colorspace_fragment>","#include <encodings_fragment>"))}}get color(){return this.uniforms.litFactor.value}set color(t){this.uniforms.litFactor.value=t}get map(){return this.uniforms.map.value}set map(t){this.uniforms.map.value=t}get normalMap(){return this.uniforms.normalMap.value}set normalMap(t){this.uniforms.normalMap.value=t}get normalScale(){return this.uniforms.normalScale.value}set normalScale(t){this.uniforms.normalScale.value=t}get emissive(){return this.uniforms.emissive.value}set emissive(t){this.uniforms.emissive.value=t}get emissiveIntensity(){return this.uniforms.emissiveIntensity.value}set emissiveIntensity(t){this.uniforms.emissiveIntensity.value=t}get emissiveMap(){return this.uniforms.emissiveMap.value}set emissiveMap(t){this.uniforms.emissiveMap.value=t}get shadeColorFactor(){return this.uniforms.shadeColorFactor.value}set shadeColorFactor(t){this.uniforms.shadeColorFactor.value=t}get shadeMultiplyTexture(){return this.uniforms.shadeMultiplyTexture.value}set shadeMultiplyTexture(t){this.uniforms.shadeMultiplyTexture.value=t}get shadingShiftFactor(){return this.uniforms.shadingShiftFactor.value}set shadingShiftFactor(t){this.uniforms.shadingShiftFactor.value=t}get shadingShiftTexture(){return this.uniforms.shadingShiftTexture.value}set shadingShiftTexture(t){this.uniforms.shadingShiftTexture.value=t}get shadingShiftTextureScale(){return this.uniforms.shadingShiftTextureScale.value}set shadingShiftTextureScale(t){this.uniforms.shadingShiftTextureScale.value=t}get shadingToonyFactor(){return this.uniforms.shadingToonyFactor.value}set shadingToonyFactor(t){this.uniforms.shadingToonyFactor.value=t}get giEqualizationFactor(){return this.uniforms.giEqualizationFactor.value}set giEqualizationFactor(t){this.uniforms.giEqualizationFactor.value=t}get matcapFactor(){return this.uniforms.matcapFactor.value}set matcapFactor(t){this.uniforms.matcapFactor.value=t}get matcapTexture(){return this.uniforms.matcapTexture.value}set matcapTexture(t){this.uniforms.matcapTexture.value=t}get parametricRimColorFactor(){return this.uniforms.parametricRimColorFactor.value}set parametricRimColorFactor(t){this.uniforms.parametricRimColorFactor.value=t}get rimMultiplyTexture(){return this.uniforms.rimMultiplyTexture.value}set rimMultiplyTexture(t){this.uniforms.rimMultiplyTexture.value=t}get rimLightingMixFactor(){return this.uniforms.rimLightingMixFactor.value}set rimLightingMixFactor(t){this.uniforms.rimLightingMixFactor.value=t}get parametricRimFresnelPowerFactor(){return this.uniforms.parametricRimFresnelPowerFactor.value}set parametricRimFresnelPowerFactor(t){this.uniforms.parametricRimFresnelPowerFactor.value=t}get parametricRimLiftFactor(){return this.uniforms.parametricRimLiftFactor.value}set parametricRimLiftFactor(t){this.uniforms.parametricRimLiftFactor.value=t}get outlineWidthMultiplyTexture(){return this.uniforms.outlineWidthMultiplyTexture.value}set outlineWidthMultiplyTexture(t){this.uniforms.outlineWidthMultiplyTexture.value=t}get outlineWidthFactor(){return this.uniforms.outlineWidthFactor.value}set outlineWidthFactor(t){this.uniforms.outlineWidthFactor.value=t}get outlineColorFactor(){return this.uniforms.outlineColorFactor.value}set outlineColorFactor(t){this.uniforms.outlineColorFactor.value=t}get outlineLightingMixFactor(){return this.uniforms.outlineLightingMixFactor.value}set outlineLightingMixFactor(t){this.uniforms.outlineLightingMixFactor.value=t}get uvAnimationMaskTexture(){return this.uniforms.uvAnimationMaskTexture.value}set uvAnimationMaskTexture(t){this.uniforms.uvAnimationMaskTexture.value=t}get uvAnimationScrollXOffset(){return this.uniforms.uvAnimationScrollXOffset.value}set uvAnimationScrollXOffset(t){this.uniforms.uvAnimationScrollXOffset.value=t}get uvAnimationScrollYOffset(){return this.uniforms.uvAnimationScrollYOffset.value}set uvAnimationScrollYOffset(t){this.uniforms.uvAnimationScrollYOffset.value=t}get uvAnimationRotationPhase(){return this.uniforms.uvAnimationRotationPhase.value}set uvAnimationRotationPhase(t){this.uniforms.uvAnimationRotationPhase.value=t}get ignoreVertexColor(){return this._ignoreVertexColor}set ignoreVertexColor(t){this._ignoreVertexColor=t,this.needsUpdate=!0}get v0CompatShade(){return this._v0CompatShade}set v0CompatShade(t){this._v0CompatShade=t,this.needsUpdate=!0}get debugMode(){return this._debugMode}set debugMode(t){this._debugMode=t,this.needsUpdate=!0}get outlineWidthMode(){return this._outlineWidthMode}set outlineWidthMode(t){this._outlineWidthMode=t,this.needsUpdate=!0}get isOutline(){return this._isOutline}set isOutline(t){this._isOutline=t,this.needsUpdate=!0}get isMToonMaterial(){return!0}update(t){this._uploadUniformsWorkaround(),this._updateUVAnimation(t)}copy(t){return super.copy(t),this.map=t.map,this.normalMap=t.normalMap,this.emissiveMap=t.emissiveMap,this.shadeMultiplyTexture=t.shadeMultiplyTexture,this.shadingShiftTexture=t.shadingShiftTexture,this.matcapTexture=t.matcapTexture,this.rimMultiplyTexture=t.rimMultiplyTexture,this.outlineWidthMultiplyTexture=t.outlineWidthMultiplyTexture,this.uvAnimationMaskTexture=t.uvAnimationMaskTexture,this.normalMapType=t.normalMapType,this.uvAnimationScrollXSpeedFactor=t.uvAnimationScrollXSpeedFactor,this.uvAnimationScrollYSpeedFactor=t.uvAnimationScrollYSpeedFactor,this.uvAnimationRotationSpeedFactor=t.uvAnimationRotationSpeedFactor,this.ignoreVertexColor=t.ignoreVertexColor,this.v0CompatShade=t.v0CompatShade,this.debugMode=t.debugMode,this.outlineWidthMode=t.outlineWidthMode,this.isOutline=t.isOutline,this.needsUpdate=!0,this}_updateUVAnimation(t){this.uniforms.uvAnimationScrollXOffset.value+=t*this.uvAnimationScrollXSpeedFactor,this.uniforms.uvAnimationScrollYOffset.value+=t*this.uvAnimationScrollYSpeedFactor,this.uniforms.uvAnimationRotationPhase.value+=t*this.uvAnimationRotationSpeedFactor,this.uniforms.alphaTest.value=this.alphaTest,this.uniformsNeedUpdate=!0}_uploadUniformsWorkaround(){this.uniforms.opacity.value=this.opacity,this._updateTextureMatrix(this.uniforms.map,this.uniforms.mapUvTransform),this._updateTextureMatrix(this.uniforms.normalMap,this.uniforms.normalMapUvTransform),this._updateTextureMatrix(this.uniforms.emissiveMap,this.uniforms.emissiveMapUvTransform),this._updateTextureMatrix(this.uniforms.shadeMultiplyTexture,this.uniforms.shadeMultiplyTextureUvTransform),this._updateTextureMatrix(this.uniforms.shadingShiftTexture,this.uniforms.shadingShiftTextureUvTransform),this._updateTextureMatrix(this.uniforms.matcapTexture,this.uniforms.matcapTextureUvTransform),this._updateTextureMatrix(this.uniforms.rimMultiplyTexture,this.uniforms.rimMultiplyTextureUvTransform),this._updateTextureMatrix(this.uniforms.outlineWidthMultiplyTexture,this.uniforms.outlineWidthMultiplyTextureUvTransform),this._updateTextureMatrix(this.uniforms.uvAnimationMaskTexture,this.uniforms.uvAnimationMaskTextureUvTransform),this.uniformsNeedUpdate=!0}_generateDefines(){let t=parseInt(ce,10),e=this.outlineWidthMultiplyTexture!==null,n=this.map!==null||this.normalMap!==null||this.emissiveMap!==null||this.shadeMultiplyTexture!==null||this.shadingShiftTexture!==null||this.rimMultiplyTexture!==null||this.uvAnimationMaskTexture!==null;return{THREE_VRM_THREE_REVISION:t,OUTLINE:this._isOutline,MTOON_USE_UV:e||n,MTOON_UVS_VERTEX_ONLY:e&&!n,V0_COMPAT_SHADE:this._v0CompatShade,USE_SHADEMULTIPLYTEXTURE:this.shadeMultiplyTexture!==null,USE_SHADINGSHIFTTEXTURE:this.shadingShiftTexture!==null,USE_MATCAPTEXTURE:this.matcapTexture!==null,USE_RIMMULTIPLYTEXTURE:this.rimMultiplyTexture!==null,USE_OUTLINEWIDTHMULTIPLYTEXTURE:this._isOutline&&this.outlineWidthMultiplyTexture!==null,USE_UVANIMATIONMASKTEXTURE:this.uvAnimationMaskTexture!==null,IGNORE_VERTEX_COLOR:this._ignoreVertexColor===!0,DEBUG_NORMAL:this._debugMode==="normal",DEBUG_LITSHADERATE:this._debugMode==="litShadeRate",DEBUG_UV:this._debugMode==="uv",OUTLINE_WIDTH_SCREEN:this._isOutline&&this._outlineWidthMode===si.ScreenCoordinates}}_updateTextureMatrix(t,e){t.value&&(t.value.matrixAutoUpdate&&t.value.updateMatrix(),e.value.copy(t.value.matrix))}},xs=new Set(["1.0","1.0-beta"]),Ci=class it{get name(){return it.EXTENSION_NAME}constructor(e,n={}){var r,i,o,s;this.parser=e,this.materialType=(r=n.materialType)!=null?r:_s,this.renderOrderOffset=(i=n.renderOrderOffset)!=null?i:0,this.v0CompatShade=(o=n.v0CompatShade)!=null?o:!1,this.debugMode=(s=n.debugMode)!=null?s:"none",this._mToonMaterialSet=new Set}beforeRoot(){return me(this,null,function*(){this._removeUnlitExtensionIfMToonExists()})}afterRoot(e){return me(this,null,function*(){e.userData.vrmMToonMaterials=Array.from(this._mToonMaterialSet)})}getMaterialType(e){return this._getMToonExtension(e)?this.materialType:null}extendMaterialParams(e,n){let r=this._getMToonExtension(e);return r?this._extendMaterialParams(r,n):null}loadMesh(e){return me(this,null,function*(){var n;let r=this.parser,o=(n=r.json.meshes)==null?void 0:n[e];if(o==null)throw new Error(`MToonMaterialLoaderPlugin: Attempt to use meshes[${e}] of glTF but the mesh doesn't exist`);let s=o.primitives,u=yield r.loadMesh(e);if(s.length===1){let a=u,c=s[0].material;c!=null&&this._setupPrimitive(a,c)}else{let a=u;for(let c=0;c<s.length;c++){let h=a.children[c],d=s[c].material;d!=null&&this._setupPrimitive(h,d)}}return u})}_removeUnlitExtensionIfMToonExists(){let r=this.parser.json.materials;r?.map((i,o)=>{var s;this._getMToonExtension(o)&&((s=i.extensions)!=null&&s.KHR_materials_unlit)&&delete i.extensions.KHR_materials_unlit})}_getMToonExtension(e){var n,r;let s=(n=this.parser.json.materials)==null?void 0:n[e];if(s==null){console.warn(`MToonMaterialLoaderPlugin: Attempt to use materials[${e}] of glTF but the material doesn't exist`);return}let u=(r=s.extensions)==null?void 0:r[it.EXTENSION_NAME];if(u==null)return;let a=u.specVersion;if(!xs.has(a)){console.warn(`MToonMaterialLoaderPlugin: Unknown ${it.EXTENSION_NAME} specVersion "${a}"`);return}return u}_extendMaterialParams(e,n){return me(this,null,function*(){var r;delete n.metalness,delete n.roughness;let i=new hs(this.parser,n);i.assignPrimitive("transparentWithZWrite",e.transparentWithZWrite),i.assignColor("shadeColorFactor",e.shadeColorFactor),i.assignTexture("shadeMultiplyTexture",e.shadeMultiplyTexture,!0),i.assignPrimitive("shadingShiftFactor",e.shadingShiftFactor),i.assignTexture("shadingShiftTexture",e.shadingShiftTexture,!0),i.assignPrimitive("shadingShiftTextureScale",(r=e.shadingShiftTexture)==null?void 0:r.scale),i.assignPrimitive("shadingToonyFactor",e.shadingToonyFactor),i.assignPrimitive("giEqualizationFactor",e.giEqualizationFactor),i.assignColor("matcapFactor",e.matcapFactor),i.assignTexture("matcapTexture",e.matcapTexture,!0),i.assignColor("parametricRimColorFactor",e.parametricRimColorFactor),i.assignTexture("rimMultiplyTexture",e.rimMultiplyTexture,!0),i.assignPrimitive("rimLightingMixFactor",e.rimLightingMixFactor),i.assignPrimitive("parametricRimFresnelPowerFactor",e.parametricRimFresnelPowerFactor),i.assignPrimitive("parametricRimLiftFactor",e.parametricRimLiftFactor),i.assignPrimitive("outlineWidthMode",e.outlineWidthMode),i.assignPrimitive("outlineWidthFactor",e.outlineWidthFactor),i.assignTexture("outlineWidthMultiplyTexture",e.outlineWidthMultiplyTexture,!1),i.assignColor("outlineColorFactor",e.outlineColorFactor),i.assignPrimitive("outlineLightingMixFactor",e.outlineLightingMixFactor),i.assignTexture("uvAnimationMaskTexture",e.uvAnimationMaskTexture,!1),i.assignPrimitive("uvAnimationScrollXSpeedFactor",e.uvAnimationScrollXSpeedFactor),i.assignPrimitive("uvAnimationScrollYSpeedFactor",e.uvAnimationScrollYSpeedFactor),i.assignPrimitive("uvAnimationRotationSpeedFactor",e.uvAnimationRotationSpeedFactor),i.assignPrimitive("v0CompatShade",this.v0CompatShade),i.assignPrimitive("debugMode",this.debugMode),yield i.pending})}_setupPrimitive(e,n){let r=this._getMToonExtension(n);if(r){let i=this._parseRenderOrder(r);e.renderOrder=i+this.renderOrderOffset,this._generateOutline(e),this._addToMaterialSet(e);return}}_shouldGenerateOutline(e){return typeof e.outlineWidthMode=="string"&&e.outlineWidthMode!=="none"&&typeof e.outlineWidthFactor=="number"&&e.outlineWidthFactor>0}_generateOutline(e){let n=e.material;if(!(n instanceof Te)||!this._shouldGenerateOutline(n))return;e.material=[n];let r=n.clone();r.name+=" (Outline)",r.isOutline=!0,r.side=$n,e.material.push(r);let i=e.geometry,o=i.index?i.index.count:i.attributes.position.count/3;i.addGroup(0,o,0),i.addGroup(0,o,1)}_addToMaterialSet(e){let n=e.material,r=new Set;Array.isArray(n)?n.forEach(i=>r.add(i)):r.add(n);for(let i of r)this._mToonMaterialSet.add(i)}_parseRenderOrder(e){var n;return(e.transparentWithZWrite?0:19)+((n=e.renderQueueOffsetNumber)!=null?n:0)}};Ci.EXTENSION_NAME="VRMC_materials_mtoon";var Ts=Ci,vs=(t,e,n)=>new Promise((r,i)=>{var o=a=>{try{u(n.next(a))}catch(c){i(c)}},s=a=>{try{u(n.throw(a))}catch(c){i(c)}},u=a=>a.done?r(a.value):Promise.resolve(a.value).then(o,s);u((n=n.apply(t,e)).next())}),Ii=class fn{get name(){return fn.EXTENSION_NAME}constructor(e){this.parser=e}extendMaterialParams(e,n){return vs(this,null,function*(){let r=this._getHDREmissiveMultiplierExtension(e);if(r==null)return;console.warn("VRMMaterialsHDREmissiveMultiplierLoaderPlugin: `VRMC_materials_hdr_emissiveMultiplier` is archived. Use `KHR_materials_emissive_strength` instead.");let i=r.emissiveMultiplier;n.emissiveIntensity=i})}_getHDREmissiveMultiplierExtension(e){var n,r;let s=(n=this.parser.json.materials)==null?void 0:n[e];if(s==null){console.warn(`VRMMaterialsHDREmissiveMultiplierLoaderPlugin: Attempt to use materials[${e}] of glTF but the material doesn't exist`);return}let u=(r=s.extensions)==null?void 0:r[fn.EXTENSION_NAME];if(u!=null)return u}};Ii.EXTENSION_NAME="VRMC_materials_hdr_emissiveMultiplier";var Es=Ii,Ms=Object.defineProperty,Rs=Object.defineProperties,As=Object.getOwnPropertyDescriptors,ai=Object.getOwnPropertySymbols,ys=Object.prototype.hasOwnProperty,Ss=Object.prototype.propertyIsEnumerable,li=(t,e,n)=>e in t?Ms(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n,K=(t,e)=>{for(var n in e||(e={}))ys.call(e,n)&&li(t,n,e[n]);if(ai)for(var n of ai(e))Ss.call(e,n)&&li(t,n,e[n]);return t},ui=(t,e)=>Rs(t,As(e)),ws=(t,e,n)=>new Promise((r,i)=>{var o=a=>{try{u(n.next(a))}catch(c){i(c)}},s=a=>{try{u(n.throw(a))}catch(c){i(c)}},u=a=>a.done?r(a.value):Promise.resolve(a.value).then(o,s);u((n=n.apply(t,e)).next())});function Ae(t){return Math.pow(t,2.2)}var Ls=class{get name(){return"VRMMaterialsV0CompatPlugin"}constructor(t){var e;this.parser=t,this._renderQueueMapTransparent=new Map,this._renderQueueMapTransparentZWrite=new Map;let n=this.parser.json;n.extensionsUsed=(e=n.extensionsUsed)!=null?e:[],n.extensionsUsed.indexOf("KHR_texture_transform")===-1&&n.extensionsUsed.push("KHR_texture_transform")}beforeRoot(){return ws(this,null,function*(){var t;let e=this.parser.json,n=(t=e.extensions)==null?void 0:t.VRM,r=n?.materialProperties;r&&(this._populateRenderQueueMap(r),r.forEach((i,o)=>{var s,u;let a=(s=e.materials)==null?void 0:s[o];if(a==null){console.warn(`VRMMaterialsV0CompatPlugin: Attempt to use materials[${o}] of glTF but the material doesn't exist`);return}if(i.shader==="VRM/MToon"){let c=this._parseV0MToonProperties(i,a);e.materials[o]=c}else if((u=i.shader)!=null&&u.startsWith("VRM/Unlit")){let c=this._parseV0UnlitProperties(i,a);e.materials[o]=c}else i.shader==="VRM_USE_GLTFSHADER"||console.warn(`VRMMaterialsV0CompatPlugin: Unknown shader: ${i.shader}`)}))})}_parseV0MToonProperties(t,e){var n,r,i,o,s,u,a,c,h,d,p,f,m,g,_,T,E,R,v,M,A,w,L,H,C,B,F,ne,Le,be,$,j,ge,Pe,k,Tn,vn,En,Mn,Rn,An,yn,Sn,wn,Ln,bn,Pn,Cn,In,Hn,Nn,Bn,On,Un,Dn;let Fn=(r=(n=t.keywordMap)==null?void 0:n._ALPHABLEND_ON)!=null?r:!1,Vi=((i=t.floatProperties)==null?void 0:i._ZWrite)===1&&Fn,ki=this._v0ParseRenderQueue(t),Vn=(s=(o=t.keywordMap)==null?void 0:o._ALPHATEST_ON)!=null?s:!1,Gi=Fn?"BLEND":Vn?"MASK":"OPAQUE",Wi=Vn?(a=(u=t.floatProperties)==null?void 0:u._Cutoff)!=null?a:.5:void 0,zi=((h=(c=t.floatProperties)==null?void 0:c._CullMode)!=null?h:2)===0,ue=this._portTextureTransform(t),ji=((p=(d=t.vectorProperties)==null?void 0:d._Color)!=null?p:[1,1,1,1]).map((Yn,go)=>go===3?Yn:Ae(Yn)),kn=(f=t.textureProperties)==null?void 0:f._MainTex,Xi=kn!=null?{index:kn,extensions:K({},ue)}:void 0,qi=(g=(m=t.floatProperties)==null?void 0:m._BumpScale)!=null?g:1,Gn=(_=t.textureProperties)==null?void 0:_._BumpMap,Qi=Gn!=null?{index:Gn,scale:qi,extensions:K({},ue)}:void 0,Yi=((E=(T=t.vectorProperties)==null?void 0:T._EmissionColor)!=null?E:[0,0,0,1]).map(Ae),Wn=(R=t.textureProperties)==null?void 0:R._EmissionMap,Ki=Wn!=null?{index:Wn,extensions:K({},ue)}:void 0,Zi=((M=(v=t.vectorProperties)==null?void 0:v._ShadeColor)!=null?M:[.97,.81,.86,1]).map(Ae),zn=(A=t.textureProperties)==null?void 0:A._ShadeTexture,$i=zn!=null?{index:zn,extensions:K({},ue)}:void 0,Ge=(L=(w=t.floatProperties)==null?void 0:w._ShadeShift)!=null?L:0,We=(C=(H=t.floatProperties)==null?void 0:H._ShadeToony)!=null?C:.9;We=N.lerp(We,1,.5+.5*Ge),Ge=-Ge-(1-We);let jn=(F=(B=t.floatProperties)==null?void 0:B._IndirectLightIntensity)!=null?F:.1,Ji=jn?1-jn:void 0,ut=(ne=t.textureProperties)==null?void 0:ne._SphereAdd,eo=ut!=null?[1,1,1]:void 0,to=ut!=null?{index:ut}:void 0,no=(be=(Le=t.floatProperties)==null?void 0:Le._RimLightingMix)!=null?be:0,Xn=($=t.textureProperties)==null?void 0:$._RimTexture,ro=Xn!=null?{index:Xn,extensions:K({},ue)}:void 0,io=((ge=(j=t.vectorProperties)==null?void 0:j._RimColor)!=null?ge:[0,0,0,1]).map(Ae),oo=(k=(Pe=t.floatProperties)==null?void 0:Pe._RimFresnelPower)!=null?k:1,so=(vn=(Tn=t.floatProperties)==null?void 0:Tn._RimLift)!=null?vn:0,ao=["none","worldCoordinates","screenCoordinates"][(Mn=(En=t.floatProperties)==null?void 0:En._OutlineWidthMode)!=null?Mn:0],ct=(An=(Rn=t.floatProperties)==null?void 0:Rn._OutlineWidth)!=null?An:0;ct=.01*ct;let qn=(yn=t.textureProperties)==null?void 0:yn._OutlineWidthTexture,lo=qn!=null?{index:qn,extensions:K({},ue)}:void 0,uo=((wn=(Sn=t.vectorProperties)==null?void 0:Sn._OutlineColor)!=null?wn:[0,0,0]).map(Ae),co=((bn=(Ln=t.floatProperties)==null?void 0:Ln._OutlineColorMode)!=null?bn:0)===1?(Cn=(Pn=t.floatProperties)==null?void 0:Pn._OutlineLightingMix)!=null?Cn:1:0,Qn=(In=t.textureProperties)==null?void 0:In._UvAnimMaskTexture,ho=Qn!=null?{index:Qn,extensions:K({},ue)}:void 0,po=(Nn=(Hn=t.floatProperties)==null?void 0:Hn._UvAnimScrollX)!=null?Nn:0,ze=(On=(Bn=t.floatProperties)==null?void 0:Bn._UvAnimScrollY)!=null?On:0;ze!=null&&(ze=-ze);let fo=(Dn=(Un=t.floatProperties)==null?void 0:Un._UvAnimRotation)!=null?Dn:0,mo={specVersion:"1.0",transparentWithZWrite:Vi,renderQueueOffsetNumber:ki,shadeColorFactor:Zi,shadeMultiplyTexture:$i,shadingShiftFactor:Ge,shadingToonyFactor:We,giEqualizationFactor:Ji,matcapFactor:eo,matcapTexture:to,rimLightingMixFactor:no,rimMultiplyTexture:ro,parametricRimColorFactor:io,parametricRimFresnelPowerFactor:oo,parametricRimLiftFactor:so,outlineWidthMode:ao,outlineWidthFactor:ct,outlineWidthMultiplyTexture:lo,outlineColorFactor:uo,outlineLightingMixFactor:co,uvAnimationMaskTexture:ho,uvAnimationScrollXSpeedFactor:po,uvAnimationScrollYSpeedFactor:ze,uvAnimationRotationSpeedFactor:fo};return ui(K({},e),{pbrMetallicRoughness:{baseColorFactor:ji,baseColorTexture:Xi},normalTexture:Qi,emissiveTexture:Ki,emissiveFactor:Yi,alphaMode:Gi,alphaCutoff:Wi,doubleSided:zi,extensions:{VRMC_materials_mtoon:mo}})}_parseV0UnlitProperties(t,e){var n,r,i,o,s;let u=t.shader==="VRM/UnlitTransparentZWrite",a=t.shader==="VRM/UnlitTransparent"||u,c=this._v0ParseRenderQueue(t),h=t.shader==="VRM/UnlitCutout",d=a?"BLEND":h?"MASK":"OPAQUE",p=h?(r=(n=t.floatProperties)==null?void 0:n._Cutoff)!=null?r:.5:void 0,f=this._portTextureTransform(t),m=((o=(i=t.vectorProperties)==null?void 0:i._Color)!=null?o:[1,1,1,1]).map(Ae),g=(s=t.textureProperties)==null?void 0:s._MainTex,_=g!=null?{index:g,extensions:K({},f)}:void 0,T={specVersion:"1.0",transparentWithZWrite:u,renderQueueOffsetNumber:c,shadeColorFactor:m,shadeMultiplyTexture:_};return ui(K({},e),{pbrMetallicRoughness:{baseColorFactor:m,baseColorTexture:_},alphaMode:d,alphaCutoff:p,extensions:{VRMC_materials_mtoon:T}})}_portTextureTransform(t){var e,n,r,i,o;let s=(e=t.vectorProperties)==null?void 0:e._MainTex;if(s==null)return{};let u=[(n=s?.[0])!=null?n:0,(r=s?.[1])!=null?r:0],a=[(i=s?.[2])!=null?i:1,(o=s?.[3])!=null?o:1];return u[1]=1-a[1]-u[1],{KHR_texture_transform:{offset:u,scale:a}}}_v0ParseRenderQueue(t){var e,n;let r=t.shader==="VRM/UnlitTransparentZWrite",i=((e=t.keywordMap)==null?void 0:e._ALPHABLEND_ON)!=null||t.shader==="VRM/UnlitTransparent"||r,o=((n=t.floatProperties)==null?void 0:n._ZWrite)===1||r,s=0;if(i){let u=t.renderQueue;u!=null&&(o?s=this._renderQueueMapTransparentZWrite.get(u):s=this._renderQueueMapTransparent.get(u))}return s}_populateRenderQueueMap(t){let e=new Set,n=new Set;t.forEach(r=>{var i,o;let s=r.shader==="VRM/UnlitTransparentZWrite",u=((i=r.keywordMap)==null?void 0:i._ALPHABLEND_ON)!=null||r.shader==="VRM/UnlitTransparent"||s,a=((o=r.floatProperties)==null?void 0:o._ZWrite)===1||s;if(u){let c=r.renderQueue;c!=null&&(a?n.add(c):e.add(c))}}),e.size>10&&console.warn(`VRMMaterialsV0CompatPlugin: This VRM uses ${e.size} render queues for Transparent materials while VRM 1.0 only supports up to 10 render queues. The model might not be rendered correctly.`),n.size>10&&console.warn(`VRMMaterialsV0CompatPlugin: This VRM uses ${n.size} render queues for TransparentZWrite materials while VRM 1.0 only supports up to 10 render queues. The model might not be rendered correctly.`),Array.from(e).sort().forEach((r,i)=>{let o=Math.min(Math.max(i-e.size+1,-9),0);this._renderQueueMapTransparent.set(r,o)}),Array.from(n).sort().forEach((r,i)=>{let o=Math.min(Math.max(i,0),9);this._renderQueueMapTransparentZWrite.set(r,o)})}},ci=(t,e,n)=>new Promise((r,i)=>{var o=a=>{try{u(n.next(a))}catch(c){i(c)}},s=a=>{try{u(n.throw(a))}catch(c){i(c)}},u=a=>a.done?r(a.value):Promise.resolve(a.value).then(o,s);u((n=n.apply(t,e)).next())}),ae=new x,nn=class extends V{constructor(t){super(),this._attrPosition=new I(new Float32Array([0,0,0,0,0,0]),3),this._attrPosition.setUsage(rr);let e=new U;e.setAttribute("position",this._attrPosition);let n=new X({color:16711935,depthTest:!1,depthWrite:!1});this._line=new je(e,n),this.add(this._line),this.constraint=t}updateMatrixWorld(t){ae.setFromMatrixPosition(this.constraint.destination.matrixWorld),this._attrPosition.setXYZ(0,ae.x,ae.y,ae.z),this.constraint.source&&ae.setFromMatrixPosition(this.constraint.source.matrixWorld),this._attrPosition.setXYZ(1,ae.x,ae.y,ae.z),this._attrPosition.needsUpdate=!0,super.updateMatrixWorld(t)}};function di(t,e){return e.set(t.elements[12],t.elements[13],t.elements[14])}var bs=new x,Ps=new x;function Cs(t,e){return t.decompose(bs,e,Ps),e}function st(t){return t.invert?t.invert():t.inverse(),t}var _n=class{constructor(t,e){this.destination=t,this.source=e,this.weight=1}},Is=new x,Hs=new x,Ns=new x,Bs=new S,Os=new S,Us=new S,Ds=class extends _n{get aimAxis(){return this._aimAxis}set aimAxis(t){this._aimAxis=t,this._v3AimAxis.set(t==="PositiveX"?1:t==="NegativeX"?-1:0,t==="PositiveY"?1:t==="NegativeY"?-1:0,t==="PositiveZ"?1:t==="NegativeZ"?-1:0)}get dependencies(){let t=new Set([this.source]);return this.destination.parent&&t.add(this.destination.parent),t}constructor(t,e){super(t,e),this._aimAxis="PositiveX",this._v3AimAxis=new x(1,0,0),this._dstRestQuat=new S}setInitState(){this._dstRestQuat.copy(this.destination.quaternion)}update(){this.destination.updateWorldMatrix(!0,!1),this.source.updateWorldMatrix(!0,!1);let t=Bs.identity(),e=Os.identity();this.destination.parent&&(Cs(this.destination.parent.matrixWorld,t),st(e.copy(t)));let n=Is.copy(this._v3AimAxis).applyQuaternion(this._dstRestQuat).applyQuaternion(t),r=di(this.source.matrixWorld,Hs).sub(di(this.destination.matrixWorld,Ns)).normalize(),i=Us.setFromUnitVectors(n,r).premultiply(e).multiply(t).multiply(this._dstRestQuat);this.destination.quaternion.copy(this._dstRestQuat).slerp(i,this.weight)}};function Fs(t,e){let n=[t],r=t.parent;for(;r!==null;)n.unshift(r),r=r.parent;n.forEach(i=>{e(i)})}var Vs=class{constructor(){this._constraints=new Set,this._objectConstraintsMap=new Map}get constraints(){return this._constraints}addConstraint(t){this._constraints.add(t);let e=this._objectConstraintsMap.get(t.destination);e==null&&(e=new Set,this._objectConstraintsMap.set(t.destination,e)),e.add(t)}deleteConstraint(t){this._constraints.delete(t),this._objectConstraintsMap.get(t.destination).delete(t)}setInitState(){let t=new Set,e=new Set;for(let n of this._constraints)this._processConstraint(n,t,e,r=>r.setInitState())}update(){let t=new Set,e=new Set;for(let n of this._constraints)this._processConstraint(n,t,e,r=>r.update())}_processConstraint(t,e,n,r){if(n.has(t))return;if(e.has(t))throw new Error("VRMNodeConstraintManager: Circular dependency detected while updating constraints");e.add(t);let i=t.dependencies;for(let o of i)Fs(o,s=>{let u=this._objectConstraintsMap.get(s);if(u)for(let a of u)this._processConstraint(a,e,n,r)});r(t),n.add(t)}},ks=new S,Gs=new S,Ws=class extends _n{get dependencies(){return new Set([this.source])}constructor(t,e){super(t,e),this._dstRestQuat=new S,this._invSrcRestQuat=new S}setInitState(){this._dstRestQuat.copy(this.destination.quaternion),st(this._invSrcRestQuat.copy(this.source.quaternion))}update(){let t=ks.copy(this._invSrcRestQuat).multiply(this.source.quaternion),e=Gs.copy(this._dstRestQuat).multiply(t);this.destination.quaternion.copy(this._dstRestQuat).slerp(e,this.weight)}},zs=new x,js=new S,Xs=new S,qs=class extends _n{get rollAxis(){return this._rollAxis}set rollAxis(t){this._rollAxis=t,this._v3RollAxis.set(t==="X"?1:0,t==="Y"?1:0,t==="Z"?1:0)}get dependencies(){return new Set([this.source])}constructor(t,e){super(t,e),this._rollAxis="X",this._v3RollAxis=new x(1,0,0),this._dstRestQuat=new S,this._invDstRestQuat=new S,this._invSrcRestQuatMulDstRestQuat=new S}setInitState(){this._dstRestQuat.copy(this.destination.quaternion),st(this._invDstRestQuat.copy(this._dstRestQuat)),st(this._invSrcRestQuatMulDstRestQuat.copy(this.source.quaternion)).multiply(this._dstRestQuat)}update(){let t=js.copy(this._invDstRestQuat).multiply(this.source.quaternion).multiply(this._invSrcRestQuatMulDstRestQuat),e=zs.copy(this._v3RollAxis).applyQuaternion(t),r=Xs.setFromUnitVectors(e,this._v3RollAxis).premultiply(this._dstRestQuat).multiply(t);this.destination.quaternion.copy(this._dstRestQuat).slerp(r,this.weight)}},Qs=new Set(["1.0","1.0-beta"]),Hi=class ke{get name(){return ke.EXTENSION_NAME}constructor(e,n){this.parser=e,this.helperRoot=n?.helperRoot}afterRoot(e){return ci(this,null,function*(){e.userData.vrmNodeConstraintManager=yield this._import(e)})}_import(e){return ci(this,null,function*(){var n;let r=this.parser.json;if(!(((n=r.extensionsUsed)==null?void 0:n.indexOf(ke.EXTENSION_NAME))!==-1))return null;let o=new Vs,s=yield this.parser.getDependencies("node");return s.forEach((u,a)=>{var c;let h=r.nodes[a],d=(c=h?.extensions)==null?void 0:c[ke.EXTENSION_NAME];if(d==null)return;let p=d.specVersion;if(!Qs.has(p)){console.warn(`VRMNodeConstraintLoaderPlugin: Unknown ${ke.EXTENSION_NAME} specVersion "${p}"`);return}let f=d.constraint;if(f.roll!=null){let m=this._importRollConstraint(u,s,f.roll);o.addConstraint(m)}else if(f.aim!=null){let m=this._importAimConstraint(u,s,f.aim);o.addConstraint(m)}else if(f.rotation!=null){let m=this._importRotationConstraint(u,s,f.rotation);o.addConstraint(m)}}),e.scene.updateMatrixWorld(),o.setInitState(),o})}_importRollConstraint(e,n,r){let{source:i,rollAxis:o,weight:s}=r,u=n[i],a=new qs(e,u);if(o!=null&&(a.rollAxis=o),s!=null&&(a.weight=s),this.helperRoot){let c=new nn(a);this.helperRoot.add(c)}return a}_importAimConstraint(e,n,r){let{source:i,aimAxis:o,weight:s}=r,u=n[i],a=new Ds(e,u);if(o!=null&&(a.aimAxis=o),s!=null&&(a.weight=s),this.helperRoot){let c=new nn(a);this.helperRoot.add(c)}return a}_importRotationConstraint(e,n,r){let{source:i,weight:o}=r,s=n[i],u=new Ws(e,s);if(o!=null&&(u.weight=o),this.helperRoot){let a=new nn(u);this.helperRoot.add(a)}return u}};Hi.EXTENSION_NAME="VRMC_node_constraint";var Ys=Hi,tt=(t,e,n)=>new Promise((r,i)=>{var o=a=>{try{u(n.next(a))}catch(c){i(c)}},s=a=>{try{u(n.throw(a))}catch(c){i(c)}},u=a=>a.done?r(a.value):Promise.resolve(a.value).then(o,s);u((n=n.apply(t,e)).next())}),xn=class{},rn=new x,fe=new x,Ni=class extends xn{get type(){return"capsule"}constructor(t){var e,n,r,i;super(),this.offset=(e=t?.offset)!=null?e:new x(0,0,0),this.tail=(n=t?.tail)!=null?n:new x(0,0,0),this.radius=(r=t?.radius)!=null?r:0,this.inside=(i=t?.inside)!=null?i:!1}calculateCollision(t,e,n,r){rn.setFromMatrixPosition(t),fe.subVectors(this.tail,this.offset).applyMatrix4(t),fe.sub(rn);let i=fe.lengthSq();r.copy(e).sub(rn);let o=fe.dot(r);o<=0||(i<=o||fe.multiplyScalar(o/i),r.sub(fe));let s=r.length(),u=this.inside?this.radius-n-s:s-n-this.radius;return u<0&&(r.multiplyScalar(1/s),this.inside&&r.negate()),u}},on=new x,hi=new G,Bi=class extends xn{get type(){return"plane"}constructor(t){var e,n;super(),this.offset=(e=t?.offset)!=null?e:new x(0,0,0),this.normal=(n=t?.normal)!=null?n:new x(0,0,1)}calculateCollision(t,e,n,r){r.setFromMatrixPosition(t),r.negate().add(e),hi.getNormalMatrix(t),on.copy(this.normal).applyNormalMatrix(hi).normalize();let i=r.dot(on)-n;return r.copy(on),i}},Ks=new x,Oi=class extends xn{get type(){return"sphere"}constructor(t){var e,n,r;super(),this.offset=(e=t?.offset)!=null?e:new x(0,0,0),this.radius=(n=t?.radius)!=null?n:0,this.inside=(r=t?.inside)!=null?r:!1}calculateCollision(t,e,n,r){r.subVectors(e,Ks.setFromMatrixPosition(t));let i=r.length(),o=this.inside?this.radius-n-i:i-n-this.radius;return o<0&&(r.multiplyScalar(1/i),this.inside&&r.negate()),o}},Z=new x,Zs=class extends U{constructor(t){super(),this.worldScale=1,this._currentRadius=0,this._currentOffset=new x,this._currentTail=new x,this._shape=t,this._attrPos=new I(new Float32Array(396),3),this.setAttribute("position",this._attrPos),this._attrIndex=new I(new Uint16Array(264),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let t=!1,e=this._shape.radius/this.worldScale;this._currentRadius!==e&&(this._currentRadius=e,t=!0),this._currentOffset.equals(this._shape.offset)||(this._currentOffset.copy(this._shape.offset),t=!0);let n=Z.copy(this._shape.tail).divideScalar(this.worldScale);this._currentTail.distanceToSquared(n)>1e-10&&(this._currentTail.copy(n),t=!0),t&&this._buildPosition()}_buildPosition(){Z.copy(this._currentTail).sub(this._currentOffset);let t=Z.length()/this._currentRadius;for(let r=0;r<=16;r++){let i=r/16*Math.PI;this._attrPos.setXYZ(r,-Math.sin(i),-Math.cos(i),0),this._attrPos.setXYZ(17+r,t+Math.sin(i),Math.cos(i),0),this._attrPos.setXYZ(34+r,-Math.sin(i),0,-Math.cos(i)),this._attrPos.setXYZ(51+r,t+Math.sin(i),0,Math.cos(i))}for(let r=0;r<32;r++){let i=r/16*Math.PI;this._attrPos.setXYZ(68+r,0,Math.sin(i),Math.cos(i)),this._attrPos.setXYZ(100+r,t,Math.sin(i),Math.cos(i))}let e=Math.atan2(Z.y,Math.sqrt(Z.x*Z.x+Z.z*Z.z)),n=-Math.atan2(Z.z,Z.x);this.rotateZ(e),this.rotateY(n),this.scale(this._currentRadius,this._currentRadius,this._currentRadius),this.translate(this._currentOffset.x,this._currentOffset.y,this._currentOffset.z),this._attrPos.needsUpdate=!0}_buildIndex(){for(let t=0;t<34;t++){let e=(t+1)%34;this._attrIndex.setXY(t*2,t,e),this._attrIndex.setXY(68+t*2,34+t,34+e)}for(let t=0;t<32;t++){let e=(t+1)%32;this._attrIndex.setXY(136+t*2,68+t,68+e),this._attrIndex.setXY(200+t*2,100+t,100+e)}this._attrIndex.needsUpdate=!0}},$s=class extends U{constructor(t){super(),this.worldScale=1,this._currentOffset=new x,this._currentNormal=new x,this._shape=t,this._attrPos=new I(new Float32Array(18),3),this.setAttribute("position",this._attrPos),this._attrIndex=new I(new Uint16Array(10),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let t=!1;this._currentOffset.equals(this._shape.offset)||(this._currentOffset.copy(this._shape.offset),t=!0),this._currentNormal.equals(this._shape.normal)||(this._currentNormal.copy(this._shape.normal),t=!0),t&&this._buildPosition()}_buildPosition(){this._attrPos.setXYZ(0,-.5,-.5,0),this._attrPos.setXYZ(1,.5,-.5,0),this._attrPos.setXYZ(2,.5,.5,0),this._attrPos.setXYZ(3,-.5,.5,0),this._attrPos.setXYZ(4,0,0,0),this._attrPos.setXYZ(5,0,0,.25),this.translate(this._currentOffset.x,this._currentOffset.y,this._currentOffset.z),this.lookAt(this._currentNormal),this._attrPos.needsUpdate=!0}_buildIndex(){this._attrIndex.setXY(0,0,1),this._attrIndex.setXY(2,1,2),this._attrIndex.setXY(4,2,3),this._attrIndex.setXY(6,3,0),this._attrIndex.setXY(8,4,5),this._attrIndex.needsUpdate=!0}},Js=class extends U{constructor(t){super(),this.worldScale=1,this._currentRadius=0,this._currentOffset=new x,this._shape=t,this._attrPos=new I(new Float32Array(288),3),this.setAttribute("position",this._attrPos),this._attrIndex=new I(new Uint16Array(192),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let t=!1,e=this._shape.radius/this.worldScale;this._currentRadius!==e&&(this._currentRadius=e,t=!0),this._currentOffset.equals(this._shape.offset)||(this._currentOffset.copy(this._shape.offset),t=!0),t&&this._buildPosition()}_buildPosition(){for(let t=0;t<32;t++){let e=t/16*Math.PI;this._attrPos.setXYZ(t,Math.cos(e),Math.sin(e),0),this._attrPos.setXYZ(32+t,0,Math.cos(e),Math.sin(e)),this._attrPos.setXYZ(64+t,Math.sin(e),0,Math.cos(e))}this.scale(this._currentRadius,this._currentRadius,this._currentRadius),this.translate(this._currentOffset.x,this._currentOffset.y,this._currentOffset.z),this._attrPos.needsUpdate=!0}_buildIndex(){for(let t=0;t<32;t++){let e=(t+1)%32;this._attrIndex.setXY(t*2,t,e),this._attrIndex.setXY(64+t*2,32+t,32+e),this._attrIndex.setXY(128+t*2,64+t,64+e)}this._attrIndex.needsUpdate=!0}},ea=new x,sn=class extends V{constructor(t){if(super(),this.matrixAutoUpdate=!1,this.collider=t,this.collider.shape instanceof Oi)this._geometry=new Js(this.collider.shape);else if(this.collider.shape instanceof Ni)this._geometry=new Zs(this.collider.shape);else if(this.collider.shape instanceof Bi)this._geometry=new $s(this.collider.shape);else throw new Error("VRMSpringBoneColliderHelper: Unknown collider shape type detected");let e=new X({color:16711935,depthTest:!1,depthWrite:!1});this._line=new re(this._geometry,e),this.add(this._line)}dispose(){this._geometry.dispose()}updateMatrixWorld(t){this.collider.updateWorldMatrix(!0,!1),this.matrix.copy(this.collider.matrixWorld);let e=this.matrix.elements;this._geometry.worldScale=ea.set(e[0],e[1],e[2]).length(),this._geometry.update(),super.updateMatrixWorld(t)}},ta=class extends U{constructor(t){super(),this.worldScale=1,this._currentRadius=0,this._currentTail=new x,this._springBone=t,this._attrPos=new I(new Float32Array(294),3),this.setAttribute("position",this._attrPos),this._attrIndex=new I(new Uint16Array(194),1),this.setIndex(this._attrIndex),this._buildIndex(),this.update()}update(){let t=!1,e=this._springBone.settings.hitRadius/this.worldScale;this._currentRadius!==e&&(this._currentRadius=e,t=!0),this._currentTail.equals(this._springBone.initialLocalChildPosition)||(this._currentTail.copy(this._springBone.initialLocalChildPosition),t=!0),t&&this._buildPosition()}_buildPosition(){for(let t=0;t<32;t++){let e=t/16*Math.PI;this._attrPos.setXYZ(t,Math.cos(e),Math.sin(e),0),this._attrPos.setXYZ(32+t,0,Math.cos(e),Math.sin(e)),this._attrPos.setXYZ(64+t,Math.sin(e),0,Math.cos(e))}this.scale(this._currentRadius,this._currentRadius,this._currentRadius),this.translate(this._currentTail.x,this._currentTail.y,this._currentTail.z),this._attrPos.setXYZ(96,0,0,0),this._attrPos.setXYZ(97,this._currentTail.x,this._currentTail.y,this._currentTail.z),this._attrPos.needsUpdate=!0}_buildIndex(){for(let t=0;t<32;t++){let e=(t+1)%32;this._attrIndex.setXY(t*2,t,e),this._attrIndex.setXY(64+t*2,32+t,32+e),this._attrIndex.setXY(128+t*2,64+t,64+e)}this._attrIndex.setXY(192,96,97),this._attrIndex.needsUpdate=!0}},na=new x,ra=class extends V{constructor(t){super(),this.matrixAutoUpdate=!1,this.springBone=t,this._geometry=new ta(this.springBone);let e=new X({color:16776960,depthTest:!1,depthWrite:!1});this._line=new re(this._geometry,e),this.add(this._line)}dispose(){this._geometry.dispose()}updateMatrixWorld(t){this.springBone.bone.updateWorldMatrix(!0,!1),this.matrix.copy(this.springBone.bone.matrixWorld);let e=this.matrix.elements;this._geometry.worldScale=na.set(e[0],e[1],e[2]).length(),this._geometry.update(),super.updateMatrixWorld(t)}},an=class extends q{constructor(t){super(),this.colliderMatrix=new D,this.shape=t}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),ia(this.colliderMatrix,this.matrixWorld,this.shape.offset)}};function ia(t,e,n){let r=e.elements;t.copy(e),n&&(t.elements[12]=r[0]*n.x+r[4]*n.y+r[8]*n.z+r[12],t.elements[13]=r[1]*n.x+r[5]*n.y+r[9]*n.z+r[13],t.elements[14]=r[2]*n.x+r[6]*n.y+r[10]*n.z+r[14])}var oa=new D;function sa(t){return t.invert?t.invert():t.getInverse(oa.copy(t)),t}var aa=class{constructor(t){this._inverseCache=new D,this._shouldUpdateInverse=!0,this.matrix=t;let e={set:(n,r,i)=>(this._shouldUpdateInverse=!0,n[r]=i,!0)};this._originalElements=t.elements,t.elements=new Proxy(t.elements,e)}get inverse(){return this._shouldUpdateInverse&&(sa(this._inverseCache.copy(this.matrix)),this._shouldUpdateInverse=!1),this._inverseCache}revert(){this.matrix.elements=this._originalElements}},ln=new D,ye=new x,De=new x,Fe=new x,Ve=new x,la=new D,ua=class{constructor(t,e,n={},r=[]){this._currentTail=new x,this._prevTail=new x,this._boneAxis=new x,this._worldSpaceBoneLength=0,this._center=null,this._initialLocalMatrix=new D,this._initialLocalRotation=new S,this._initialLocalChildPosition=new x;var i,o,s,u,a,c;this.bone=t,this.bone.matrixAutoUpdate=!1,this.child=e,this.settings={hitRadius:(i=n.hitRadius)!=null?i:0,stiffness:(o=n.stiffness)!=null?o:1,gravityPower:(s=n.gravityPower)!=null?s:0,gravityDir:(a=(u=n.gravityDir)==null?void 0:u.clone())!=null?a:new x(0,-1,0),dragForce:(c=n.dragForce)!=null?c:.4},this.colliderGroups=r}get dependencies(){let t=new Set,e=this.bone.parent;e&&t.add(e);for(let n=0;n<this.colliderGroups.length;n++)for(let r=0;r<this.colliderGroups[n].colliders.length;r++)t.add(this.colliderGroups[n].colliders[r]);return t}get center(){return this._center}set center(t){var e;(e=this._center)!=null&&e.userData.inverseCacheProxy&&(this._center.userData.inverseCacheProxy.revert(),delete this._center.userData.inverseCacheProxy),this._center=t,this._center&&(this._center.userData.inverseCacheProxy||(this._center.userData.inverseCacheProxy=new aa(this._center.matrixWorld)))}get initialLocalChildPosition(){return this._initialLocalChildPosition}get _parentMatrixWorld(){return this.bone.parent?this.bone.parent.matrixWorld:ln}setInitState(){this._initialLocalMatrix.copy(this.bone.matrix),this._initialLocalRotation.copy(this.bone.quaternion),this.child?this._initialLocalChildPosition.copy(this.child.position):this._initialLocalChildPosition.copy(this.bone.position).normalize().multiplyScalar(.07);let t=this._getMatrixWorldToCenter();this.bone.localToWorld(this._currentTail.copy(this._initialLocalChildPosition)).applyMatrix4(t),this._prevTail.copy(this._currentTail),this._boneAxis.copy(this._initialLocalChildPosition).normalize()}reset(){this.bone.quaternion.copy(this._initialLocalRotation),this.bone.updateMatrix(),this.bone.matrixWorld.multiplyMatrices(this._parentMatrixWorld,this.bone.matrix);let t=this._getMatrixWorldToCenter();this.bone.localToWorld(this._currentTail.copy(this._initialLocalChildPosition)).applyMatrix4(t),this._prevTail.copy(this._currentTail)}update(t){if(t<=0)return;this._calcWorldSpaceBoneLength();let e=De.copy(this._boneAxis).transformDirection(this._initialLocalMatrix).transformDirection(this._parentMatrixWorld);Ve.copy(this._currentTail).add(ye.subVectors(this._currentTail,this._prevTail).multiplyScalar(1-this.settings.dragForce)).applyMatrix4(this._getMatrixCenterToWorld()).addScaledVector(e,this.settings.stiffness*t).addScaledVector(this.settings.gravityDir,this.settings.gravityPower*t),Fe.setFromMatrixPosition(this.bone.matrixWorld),Ve.sub(Fe).normalize().multiplyScalar(this._worldSpaceBoneLength).add(Fe),this._collision(Ve),this._prevTail.copy(this._currentTail),this._currentTail.copy(Ve).applyMatrix4(this._getMatrixWorldToCenter());let n=la.multiplyMatrices(this._parentMatrixWorld,this._initialLocalMatrix).invert();this.bone.quaternion.setFromUnitVectors(this._boneAxis,ye.copy(Ve).applyMatrix4(n).normalize()).premultiply(this._initialLocalRotation),this.bone.updateMatrix(),this.bone.matrixWorld.multiplyMatrices(this._parentMatrixWorld,this.bone.matrix)}_collision(t){for(let e=0;e<this.colliderGroups.length;e++)for(let n=0;n<this.colliderGroups[e].colliders.length;n++){let r=this.colliderGroups[e].colliders[n],i=r.shape.calculateCollision(r.colliderMatrix,t,this.settings.hitRadius,ye);if(i<0){t.addScaledVector(ye,-i),t.sub(Fe);let o=t.length();t.multiplyScalar(this._worldSpaceBoneLength/o).add(Fe)}}}_calcWorldSpaceBoneLength(){ye.setFromMatrixPosition(this.bone.matrixWorld),this.child?De.setFromMatrixPosition(this.child.matrixWorld):(De.copy(this._initialLocalChildPosition),De.applyMatrix4(this.bone.matrixWorld)),this._worldSpaceBoneLength=ye.sub(De).length()}_getMatrixCenterToWorld(){return this._center?this._center.matrixWorld:ln}_getMatrixWorldToCenter(){return this._center?this._center.userData.inverseCacheProxy.inverse:ln}};function ca(t,e){let n=[],r=t;for(;r!==null;)n.unshift(r),r=r.parent;n.forEach(i=>{e(i)})}function mn(t,e){t.children.forEach(n=>{e(n)||mn(n,e)})}function da(t){var e;let n=new Map;for(let r of t){let i=r;do{let o=((e=n.get(i))!=null?e:0)+1;if(o===t.size)return i;n.set(i,o),i=i.parent}while(i!==null)}return null}var pi=class{constructor(){this._joints=new Set,this._sortedJoints=[],this._hasWarnedCircularDependency=!1,this._ancestors=[],this._objectSpringBonesMap=new Map,this._isSortedJointsDirty=!1,this._relevantChildrenUpdated=this._relevantChildrenUpdated.bind(this)}get joints(){return this._joints}get springBones(){return console.warn("VRMSpringBoneManager: springBones is deprecated. use joints instead."),this._joints}get colliderGroups(){let t=new Set;return this._joints.forEach(e=>{e.colliderGroups.forEach(n=>{t.add(n)})}),Array.from(t)}get colliders(){let t=new Set;return this.colliderGroups.forEach(e=>{e.colliders.forEach(n=>{t.add(n)})}),Array.from(t)}addJoint(t){this._joints.add(t);let e=this._objectSpringBonesMap.get(t.bone);e==null&&(e=new Set,this._objectSpringBonesMap.set(t.bone,e)),e.add(t),this._isSortedJointsDirty=!0}addSpringBone(t){console.warn("VRMSpringBoneManager: addSpringBone() is deprecated. use addJoint() instead."),this.addJoint(t)}deleteJoint(t){this._joints.delete(t),this._objectSpringBonesMap.get(t.bone).delete(t),this._isSortedJointsDirty=!0}deleteSpringBone(t){console.warn("VRMSpringBoneManager: deleteSpringBone() is deprecated. use deleteJoint() instead."),this.deleteJoint(t)}setInitState(){this._sortJoints();for(let t=0;t<this._sortedJoints.length;t++){let e=this._sortedJoints[t];e.bone.updateMatrix(),e.bone.updateWorldMatrix(!1,!1),e.setInitState()}}reset(){this._sortJoints();for(let t=0;t<this._sortedJoints.length;t++){let e=this._sortedJoints[t];e.bone.updateMatrix(),e.bone.updateWorldMatrix(!1,!1),e.reset()}}update(t){this._sortJoints();for(let e=0;e<this._ancestors.length;e++)this._ancestors[e].updateWorldMatrix(e===0,!1);for(let e=0;e<this._sortedJoints.length;e++){let n=this._sortedJoints[e];n.bone.updateMatrix(),n.bone.updateWorldMatrix(!1,!1),n.update(t),mn(n.bone,this._relevantChildrenUpdated)}}_sortJoints(){if(!this._isSortedJointsDirty)return;let t=[],e=new Set,n=new Set,r=new Set;for(let o of this._joints)this._insertJointSort(o,e,n,t,r);this._sortedJoints=t;let i=da(r);this._ancestors=[],i&&(this._ancestors.push(i),mn(i,o=>{var s,u;return((u=(s=this._objectSpringBonesMap.get(o))==null?void 0:s.size)!=null?u:0)>0?!0:(this._ancestors.push(o),!1)})),this._isSortedJointsDirty=!1}_insertJointSort(t,e,n,r,i){if(n.has(t))return;if(e.has(t)){this._hasWarnedCircularDependency||(console.warn("VRMSpringBoneManager: Circular dependency detected"),this._hasWarnedCircularDependency=!0);return}e.add(t);let o=t.dependencies;for(let s of o){let u=!1,a=null;ca(s,c=>{let h=this._objectSpringBonesMap.get(c);if(h)for(let d of h)u=!0,this._insertJointSort(d,e,n,r,i);else u||(a=c)}),a&&i.add(a)}r.push(t),n.add(t)}_relevantChildrenUpdated(t){var e,n;return((n=(e=this._objectSpringBonesMap.get(t))==null?void 0:e.size)!=null?n:0)>0?!0:(t.updateWorldMatrix(!1,!1),!1)}},fi="VRMC_springBone_extended_collider",ha=new Set(["1.0","1.0-beta"]),pa=new Set(["1.0"]),Ui=class we{get name(){return we.EXTENSION_NAME}constructor(e,n){var r;this.parser=e,this.jointHelperRoot=n?.jointHelperRoot,this.colliderHelperRoot=n?.colliderHelperRoot,this.useExtendedColliders=(r=n?.useExtendedColliders)!=null?r:!0}afterRoot(e){return tt(this,null,function*(){e.userData.vrmSpringBoneManager=yield this._import(e)})}_import(e){return tt(this,null,function*(){let n=yield this._v1Import(e);if(n!=null)return n;let r=yield this._v0Import(e);return r??null})}_v1Import(e){return tt(this,null,function*(){var n,r,i,o,s;let u=e.parser.json;if(!(((n=u.extensionsUsed)==null?void 0:n.indexOf(we.EXTENSION_NAME))!==-1))return null;let c=new pi,h=yield e.parser.getDependencies("node"),d=(r=u.extensions)==null?void 0:r[we.EXTENSION_NAME];if(!d)return null;let p=d.specVersion;if(!ha.has(p))return console.warn(`VRMSpringBoneLoaderPlugin: Unknown ${we.EXTENSION_NAME} specVersion "${p}"`),null;let f=(i=d.colliders)==null?void 0:i.map((g,_)=>{var T,E,R,v,M,A,w,L,H,C,B,F,ne,Le,be;let $=h[g.node];if($==null)return console.warn(`VRMSpringBoneLoaderPlugin: The collider #${_} attempted to reference a node #${g.node} but not found. Skipping the collider`),null;let j=g.shape,ge=(T=g.extensions)==null?void 0:T[fi];if(this.useExtendedColliders&&ge!=null){let Pe=ge.specVersion;if(!pa.has(Pe))console.warn(`VRMSpringBoneLoaderPlugin: Unknown ${fi} specVersion "${Pe}". Fallbacking to the ${we.EXTENSION_NAME} definition`);else{let k=ge.shape;if(k.sphere)return this._importSphereCollider($,{offset:new x().fromArray((E=k.sphere.offset)!=null?E:[0,0,0]),radius:(R=k.sphere.radius)!=null?R:0,inside:(v=k.sphere.inside)!=null?v:!1});if(k.capsule)return this._importCapsuleCollider($,{offset:new x().fromArray((M=k.capsule.offset)!=null?M:[0,0,0]),radius:(A=k.capsule.radius)!=null?A:0,tail:new x().fromArray((w=k.capsule.tail)!=null?w:[0,0,0]),inside:(L=k.capsule.inside)!=null?L:!1});if(k.plane)return this._importPlaneCollider($,{offset:new x().fromArray((H=k.plane.offset)!=null?H:[0,0,0]),normal:new x().fromArray((C=k.plane.normal)!=null?C:[0,0,1])})}}if(j.sphere)return this._importSphereCollider($,{offset:new x().fromArray((B=j.sphere.offset)!=null?B:[0,0,0]),radius:(F=j.sphere.radius)!=null?F:0,inside:!1});if(j.capsule)return this._importCapsuleCollider($,{offset:new x().fromArray((ne=j.capsule.offset)!=null?ne:[0,0,0]),radius:(Le=j.capsule.radius)!=null?Le:0,tail:new x().fromArray((be=j.capsule.tail)!=null?be:[0,0,0]),inside:!1});console.warn(`VRMSpringBoneLoaderPlugin: The collider #${_} has no valid shape. Skipping the collider`)}),m=(o=d.colliderGroups)==null?void 0:o.map((g,_)=>{var T;return{colliders:((T=g.colliders)!=null?T:[]).map(R=>{let v=f?.[R];return v??(console.warn(`VRMSpringBoneLoaderPlugin: The collider group #${_} attempted to reference a collider #${R} but not found. Skipping the collider`),null)}).filter(R=>R!=null),name:g.name}});return(s=d.springs)==null||s.forEach((g,_)=>{var T;let E=g.joints,R=(T=g.colliderGroups)==null?void 0:T.map(A=>{let w=m?.[A];return w??(console.warn(`VRMSpringBoneLoaderPlugin: The spring #${_} attempted to reference a collider group #${A} but not found. Skipping the collider group`),null)}).filter(A=>A!=null),v=g.center!=null?h[g.center]:void 0,M;E.forEach(A=>{if(M){let w=M.node,L=h[w],H=A.node,C=h[H],B={hitRadius:M.hitRadius,dragForce:M.dragForce,gravityPower:M.gravityPower,stiffness:M.stiffness,gravityDir:M.gravityDir!=null?new x().fromArray(M.gravityDir):void 0},F=this._importJoint(L,C,B,R);v&&(F.center=v),c.addJoint(F)}M=A})}),c.setInitState(),c})}_v0Import(e){return tt(this,null,function*(){var n,r,i;let o=e.parser.json;if(!(((n=o.extensionsUsed)==null?void 0:n.indexOf("VRM"))!==-1))return null;let u=(r=o.extensions)==null?void 0:r.VRM,a=u?.secondaryAnimation;if(!a)return null;let c=a?.boneGroups;if(!c)return null;let h=new pi,d=yield e.parser.getDependencies("node"),p=(i=a.colliderGroups)==null?void 0:i.map((f,m)=>{var g;let _=d[f.node];return _==null?(console.warn(`VRMSpringBoneLoaderPlugin: The collider group #${m} attempted to reference a node #${f.node} but not found. Skipping the collider group`),null):{colliders:((g=f.colliders)!=null?g:[]).map((E,R)=>{var v,M,A;let w=new x(0,0,0);return E.offset&&w.set((v=E.offset.x)!=null?v:0,(M=E.offset.y)!=null?M:0,E.offset.z?-E.offset.z:0),this._importSphereCollider(_,{offset:w,radius:(A=E.radius)!=null?A:0,inside:!1})})}});return c?.forEach((f,m)=>{let g=f.bones;g&&g.forEach(_=>{var T,E,R,v;let M=d[_];if(M==null){console.warn(`VRMSpringBoneLoaderPlugin: The spring bone group #${m} attempted to reference a node #${_} but not found. Skipping the node`);return}let A=new x;f.gravityDir?A.set((T=f.gravityDir.x)!=null?T:0,(E=f.gravityDir.y)!=null?E:0,(R=f.gravityDir.z)!=null?R:0):A.set(0,-1,0);let w=f.center!=null?d[f.center]:void 0,L={hitRadius:f.hitRadius,dragForce:f.dragForce,gravityPower:f.gravityPower,stiffness:f.stiffiness,gravityDir:A},H=(v=f.colliderGroups)==null?void 0:v.map(C=>{let B=p?.[C];return B??(console.warn(`VRMSpringBoneLoaderPlugin: The spring #${m} attempted to reference a collider group #${C} but not found. Skipping the collider group`),null)}).filter(C=>C!=null);M.traverse(C=>{var B;let F=(B=C.children[0])!=null?B:null,ne=this._importJoint(C,F,L,H);w&&(ne.center=w),h.addJoint(ne)})})}),e.scene.updateMatrixWorld(),h.setInitState(),h})}_importJoint(e,n,r,i){let o=new ua(e,n,r,i);if(this.jointHelperRoot){let s=new ra(o);this.jointHelperRoot.add(s),s.renderOrder=this.jointHelperRoot.renderOrder}return o}_importSphereCollider(e,n){let r=new Oi(n),i=new an(r);if(e.add(i),this.colliderHelperRoot){let o=new sn(i);this.colliderHelperRoot.add(o),o.renderOrder=this.colliderHelperRoot.renderOrder}return i}_importCapsuleCollider(e,n){let r=new Ni(n),i=new an(r);if(e.add(i),this.colliderHelperRoot){let o=new sn(i);this.colliderHelperRoot.add(o),o.renderOrder=this.colliderHelperRoot.renderOrder}return i}_importPlaneCollider(e,n){let r=new Bi(n),i=new an(r);if(e.add(i),this.colliderHelperRoot){let o=new sn(i);this.colliderHelperRoot.add(o),o.renderOrder=this.colliderHelperRoot.renderOrder}return i}};Ui.EXTENSION_NAME="VRMC_springBone";var fa=Ui,Di=class{get name(){return"VRMLoaderPlugin"}constructor(t,e){var n,r,i,o,s,u,a,c,h,d;this.parser=t;let p=e?.helperRoot,f=e?.autoUpdateHumanBones;this.expressionPlugin=(n=e?.expressionPlugin)!=null?n:new Co(t),this.firstPersonPlugin=(r=e?.firstPersonPlugin)!=null?r:new Ho(t),this.humanoidPlugin=(i=e?.humanoidPlugin)!=null?i:new Vo(t,{helperRoot:p,autoUpdateHumanBones:f}),this.lookAtPlugin=(o=e?.lookAtPlugin)!=null?o:new ts(t,{helperRoot:p}),this.metaPlugin=(s=e?.metaPlugin)!=null?s:new is(t),this.mtoonMaterialPlugin=(u=e?.mtoonMaterialPlugin)!=null?u:new Ts(t),this.materialsHDREmissiveMultiplierPlugin=(a=e?.materialsHDREmissiveMultiplierPlugin)!=null?a:new Es(t),this.materialsV0CompatPlugin=(c=e?.materialsV0CompatPlugin)!=null?c:new Ls(t),this.springBonePlugin=(h=e?.springBonePlugin)!=null?h:new fa(t,{colliderHelperRoot:p,jointHelperRoot:p}),this.nodeConstraintPlugin=(d=e?.nodeConstraintPlugin)!=null?d:new Ys(t,{helperRoot:p})}beforeRoot(){return $e(this,null,function*(){yield this.materialsV0CompatPlugin.beforeRoot(),yield this.mtoonMaterialPlugin.beforeRoot()})}loadMesh(t){return $e(this,null,function*(){return yield this.mtoonMaterialPlugin.loadMesh(t)})}getMaterialType(t){let e=this.mtoonMaterialPlugin.getMaterialType(t);return e??null}extendMaterialParams(t,e){return $e(this,null,function*(){yield this.materialsHDREmissiveMultiplierPlugin.extendMaterialParams(t,e),yield this.mtoonMaterialPlugin.extendMaterialParams(t,e)})}afterRoot(t){return $e(this,null,function*(){yield this.metaPlugin.afterRoot(t),yield this.humanoidPlugin.afterRoot(t),yield this.expressionPlugin.afterRoot(t),yield this.lookAtPlugin.afterRoot(t),yield this.firstPersonPlugin.afterRoot(t),yield this.springBonePlugin.afterRoot(t),yield this.nodeConstraintPlugin.afterRoot(t),yield this.mtoonMaterialPlugin.afterRoot(t);let e=t.userData.vrmMeta,n=t.userData.vrmHumanoid;if(e&&n){let r=new ss({scene:t.scene,expressionManager:t.userData.vrmExpressionManager,firstPerson:t.userData.vrmFirstPerson,humanoid:n,lookAt:t.userData.vrmLookAt,meta:e,materials:t.userData.vrmMToonMaterials,springBoneManager:t.userData.vrmSpringBoneManager,nodeConstraintManager:t.userData.vrmNodeConstraintManager});t.userData.vrm=r}})}};function ma(t){let e=new Set;return t.traverse(n=>{if(!n.isMesh)return;let r=n;e.add(r)}),e}function mi(t,e,n){if(e.size===1){let s=e.values().next().value;if(s.weight===1)return t[s.index]}let r=new Float32Array(t[0].count*3),i=0;if(n)i=1;else for(let s of e)i+=s.weight;for(let s of e){let u=t[s.index],a=s.weight/i;for(let c=0;c<u.count;c++)r[c*3+0]+=u.getX(c)*a,r[c*3+1]+=u.getY(c)*a,r[c*3+2]+=u.getZ(c)*a}return new I(r,3)}function ga(t){var e;let n=ma(t.scene),r=new Map,i=(e=t.expressionManager)==null?void 0:e.expressionMap;if(i!=null)for(let[o,s]of Object.entries(i)){let u=new Set;for(let a of s.binds)if(a instanceof ot){if(a.weight!==0)for(let c of a.primitives){let h=r.get(c);h==null&&(h=new Map,r.set(c,h));let d=h.get(o);d==null&&(d=new Set,h.set(o,d)),d.add(a)}u.add(a)}for(let a of u)s.deleteBind(a)}for(let o of n){let s=r.get(o);if(s==null)continue;let u=o.geometry.morphAttributes;o.geometry.morphAttributes={};let a=o.geometry.clone();o.geometry=a;let c=a.morphTargetsRelative,h=u.position!=null,d=u.normal!=null,p={},f={},m=[];if(h||d){h&&(p.position=[]),d&&(p.normal=[]);let g=0;for(let[_,T]of s)h&&(p.position[g]=mi(u.position,T,c)),d&&(p.normal[g]=mi(u.normal,T,c)),i?.[_].addBind(new ot({index:g,weight:1,primitives:[o]})),f[_]=g,m.push(0),g++}a.morphAttributes=p,o.morphTargetDictionary=f,o.morphTargetInfluences=m}}function at(t,e,n){if(t.getComponent)return t.getComponent(e,n);{let r=t.array[e*t.itemSize+n];return t.normalized&&(r=N.denormalize(r,t.array)),r}}function Fi(t,e,n,r){t.setComponent?t.setComponent(e,n,r):(t.normalized&&(r=N.normalize(r,t.array)),t.array[e*t.itemSize+n]=r)}function _a(t){var e;let n=xa(t),r=new Set;for(let d of n)r.has(d.geometry)&&(d.geometry=Aa(d.geometry)),r.add(d.geometry);let i=new Map;for(let d of r){let p=d.getAttribute("skinIndex"),f=(e=i.get(p))!=null?e:new Map;i.set(p,f);let m=d.getAttribute("skinWeight"),g=Ta(p,m);f.set(m,g)}let o=new Map;for(let d of n){let p=va(d,i);o.set(d,p)}let s=[];for(let[d,p]of o){let f=!1;for(let m of s)if(Ea(p,m.boneInverseMap)){f=!0,m.meshes.add(d);for(let[_,T]of p)m.boneInverseMap.set(_,T);break}f||s.push({boneInverseMap:p,meshes:new Set([d])})}let u=new Map,a=new un,c=new un,h=new un;for(let d of s){let{boneInverseMap:p,meshes:f}=d,m=Array.from(p.keys()),g=Array.from(p.values()),_=new ie(m,g),T=c.getOrCreate(_);for(let E of f){let R=E.geometry.getAttribute("skinIndex"),v=a.getOrCreate(R),M=E.skeleton.bones,A=M.map(H=>h.getOrCreate(H)).join(","),w=`${v};${T};${A}`,L=u.get(w);L==null&&(L=R.clone(),Ma(L,M,m),u.set(w,L)),E.geometry.setAttribute("skinIndex",L)}for(let E of f)E.bind(_,new D)}}function xa(t){let e=new Set;return t.traverse(n=>{if(!n.isSkinnedMesh)return;let r=n;e.add(r)}),e}function Ta(t,e){let n=new Set;for(let r=0;r<t.count;r++)for(let i=0;i<t.itemSize;i++){let o=at(t,r,i);at(e,r,i)!==0&&n.add(o)}return n}function va(t,e){let n=new Map,r=t.skeleton,i=t.geometry,o=i.getAttribute("skinIndex"),s=i.getAttribute("skinWeight"),u=e.get(o),a=u?.get(s);if(!a)throw new Error("Unreachable. attributeUsedIndexSetMap does not know the skin index attribute or the skin weight attribute.");for(let c of a)n.set(r.bones[c],r.boneInverses[c]);return n}function Ea(t,e){for(let[n,r]of t.entries()){let i=e.get(n);if(i!=null&&!Ra(r,i))return!1}return!0}function Ma(t,e,n){let r=new Map;for(let o of e)r.set(o,r.size);let i=new Map;for(let[o,s]of n.entries()){let u=r.get(s);i.set(u,o)}for(let o=0;o<t.count;o++)for(let s=0;s<t.itemSize;s++){let u=at(t,o,s),a=i.get(u);Fi(t,o,s,a)}t.needsUpdate=!0}function Ra(t,e,n){if(n=n||1e-4,t.elements.length!=e.elements.length)return!1;for(let r=0,i=t.elements.length;r<i;r++)if(Math.abs(t.elements[r]-e.elements[r])>n)return!1;return!0}var un=class{constructor(){this._objectIndexMap=new Map,this._index=0}get(t){return this._objectIndexMap.get(t)}getOrCreate(t){let e=this._objectIndexMap.get(t);return e==null&&(e=this._index,this._objectIndexMap.set(t,e),this._index++),e}};function Aa(t){var e,n,r,i;let o=new U;o.name=t.name,o.setIndex(t.index);for(let[s,u]of Object.entries(t.attributes))o.setAttribute(s,u);for(let[s,u]of Object.entries(t.morphAttributes)){let a=s;o.morphAttributes[a]=u.concat()}o.morphTargetsRelative=t.morphTargetsRelative,o.groups=[];for(let s of t.groups)o.addGroup(s.start,s.count,s.materialIndex);return o.boundingSphere=(n=(e=t.boundingSphere)==null?void 0:e.clone())!=null?n:null,o.boundingBox=(i=(r=t.boundingBox)==null?void 0:r.clone())!=null?i:null,o.drawRange.start=t.drawRange.start,o.drawRange.count=t.drawRange.count,o.userData=t.userData,o}function gi(t){if(Object.values(t).forEach(e=>{e?.isTexture&&e.dispose()}),t.isShaderMaterial){let e=t.uniforms;e&&Object.values(e).forEach(n=>{let r=n.value;r?.isTexture&&r.dispose()})}t.dispose()}function ya(t){let e=t.geometry;e&&e.dispose();let n=t.skeleton;n&&n.dispose();let r=t.material;r&&(Array.isArray(r)?r.forEach(i=>gi(i)):r&&gi(r))}function Sa(t){t.traverse(ya)}function wa(t,e){var n,r;console.warn("VRMUtils.removeUnnecessaryJoints: removeUnnecessaryJoints is deprecated. Use combineSkeletons instead. combineSkeletons contributes more to the performance improvement. This function will be removed in the next major version.");let i=(n=e?.experimentalSameBoneCounts)!=null?n:!1,o=[];t.traverse(a=>{a.type==="SkinnedMesh"&&o.push(a)});let s=new Map,u=0;for(let a of o){let h=a.geometry.getAttribute("skinIndex");if(s.has(h))continue;let d=new Map,p=new Map;for(let f=0;f<h.count;f++)for(let m=0;m<h.itemSize;m++){let g=at(h,f,m),_=d.get(g);_==null&&(_=d.size,d.set(g,_),p.set(_,g)),Fi(h,f,m,_)}h.needsUpdate=!0,s.set(h,p),u=Math.max(u,d.size)}for(let a of o){let h=a.geometry.getAttribute("skinIndex"),d=s.get(h),p=[],f=[],m=i?u:d.size;for(let _=0;_<m;_++){let T=(r=d.get(_))!=null?r:0;p.push(a.skeleton.bones[T]),f.push(a.skeleton.boneInverses[T])}let g=new ie(p,f);a.bind(g,new D)}}function La(t,e){let n=t.position.count,r=new Array(n),i=0,o=e.array;for(let s=0;s<o.length;s++){let u=o[s];r[u]||(r[u]=!0,i++)}return{isVertexUsed:r,vertexCount:n,verticesUsed:i}}function ba(t){let e=[],n=[],r=0;for(let i=0;i<t.length;i++)if(t[i]){let o=r++;e[i]=o,n[o]=i}return{originalIndexNewIndexMap:e,newIndexOriginalIndexMap:n}}function Pa(t,e){var n,r,i,o;e.name=t.name,e.morphTargetsRelative=t.morphTargetsRelative,t.groups.forEach(s=>{e.addGroup(s.start,s.count,s.materialIndex)}),e.boundingBox=(r=(n=t.boundingBox)==null?void 0:n.clone())!=null?r:null,e.boundingSphere=(o=(i=t.boundingSphere)==null?void 0:i.clone())!=null?o:null,e.setDrawRange(t.drawRange.start,t.drawRange.count),e.userData=t.userData}function Ca(t,e,n){let r=e.array,i=new r.constructor(r.length);for(let o=0;o<r.length;o++){let s=r[o];i[o]=n[s]}t.setIndex(new I(i,e.itemSize,e.normalized))}function lt(t,e,n){let r=t.constructor,i=new r(e.length*n),o=!0;for(let s=0;s<e.length;s++){let a=e[s]*n,c=s*n;for(let h=0;h<n;h++){let d=t[a+h];i[c+h]=d,o=o&&d===0}}return[i,o]}function Ia(t){var e;let n=new Map,r=[];for(let[i,o]of Object.entries(t))if(o.isInterleavedBufferAttribute){let s=o,u=s.data,a=(e=n.get(u))!=null?e:[];n.set(u,a),a.push([i,s])}else{let s=o;r.push([i,s])}return[n,r]}function Ha(t,e,n){let[r,i]=Ia(e);for(let[o,s]of r){let u=o.array,{stride:a}=o,[c,h]=lt(u,n,a),d=new _e(c,a);d.setUsage(o.usage);for(let[p,f]of s){let{itemSize:m,offset:g,normalized:_}=f,T=new xe(d,m,g,_);t.setAttribute(p,T)}}for(let[o,s]of i){let u=s.array,{itemSize:a,normalized:c}=s,[h,d]=lt(u,n,a);t.setAttribute(o,new I(h,a,c))}}function Na(t){var e;let n=new Map,r=[];for(let[i,o]of Object.entries(t)){let s=i;for(let u=0;u<o.length;u++){let a=o[u];if(a.isInterleavedBufferAttribute){let c=a,h=c.data,d=(e=n.get(h))!=null?e:[];n.set(h,d),d.push([s,u,c])}else{let c=a;r.push([s,u,c])}}}return[n,r]}function Ba(t,e,n){var r,i;let o=!0,[s,u]=Na(e),a={};for(let[c,h]of s){let d=c.array,{stride:p}=c,[f,m]=lt(d,n,p);o=o&&m;let g=new _e(f,p);g.setUsage(c.usage);for(let[_,T,E]of h){let{itemSize:R,offset:v,normalized:M}=E,A=new xe(g,R,v,M);(r=a[_])!=null||(a[_]=[]),a[_][T]=A}}for(let[c,h,d]of u){let p=d,f=p.array,{itemSize:m,normalized:g}=p,[_,T]=lt(f,n,m);o=o&&T,(i=a[c])!=null||(a[c]=[]),a[c][h]=new I(_,m,g)}t.morphAttributes=o?{}:a}function Oa(t){let e=new Map;t.traverse(n=>{if(!n.isMesh)return;let r=n,i=r.geometry,o=i.index;if(o==null)return;let s=e.get(i);if(s!=null){r.geometry=s;return}let{isVertexUsed:u,vertexCount:a,verticesUsed:c}=La(i.attributes,o);if(c===a)return;let{originalIndexNewIndexMap:h,newIndexOriginalIndexMap:d}=ba(u),p=new U;Pa(i,p),e.set(i,p),Ca(p,o,h),Ha(p,i.attributes,d),Ba(p,i.morphAttributes,d),r.geometry=p}),Array.from(e.keys()).forEach(n=>{n.dispose()})}function Ua(t){var e;((e=t.meta)==null?void 0:e.metaVersion)==="0"&&(t.scene.rotation.y=Math.PI)}var le=class{constructor(){}};le.combineMorphs=ga;le.combineSkeletons=_a;le.deepDispose=Sa;le.removeUnnecessaryJoints=wa;le.removeUnnecessaryVertices=Oa;le.rotateVRM0=Ua;window.VRMKit={GLTFLoader:Ke,VRMLoaderPlugin:Di,VRMUtils:le};})();
/*! Bundled license information:

@pixiv/three-vrm/lib/three-vrm.module.js:
  (*!
   * @pixiv/three-vrm v3.5.5
   * VRM file loader for three.js.
   *
   * Copyright (c) 2019-2026 pixiv Inc.
   * @pixiv/three-vrm is distributed under MIT License
   * https://github.com/pixiv/three-vrm/blob/release/LICENSE
   *)

@pixiv/three-vrm/lib/three-vrm.module.js:
  (*!
   * @pixiv/three-vrm-core v3.5.5
   * The implementation of core features of VRM, for @pixiv/three-vrm
   *
   * Copyright (c) 2019-2026 pixiv Inc.
   * @pixiv/three-vrm-core is distributed under MIT License
   * https://github.com/pixiv/three-vrm/blob/release/LICENSE
   *)
  (*!
   * @pixiv/three-vrm-materials-mtoon v3.5.5
   * MToon (toon material) module for @pixiv/three-vrm
   *
   * Copyright (c) 2019-2026 pixiv Inc.
   * @pixiv/three-vrm-materials-mtoon is distributed under MIT License
   * https://github.com/pixiv/three-vrm/blob/release/LICENSE
   *)
  (*!
   * @pixiv/three-vrm-materials-hdr-emissive-multiplier v3.5.5
   * Support VRMC_hdr_emissiveMultiplier for @pixiv/three-vrm
   *
   * Copyright (c) 2019-2026 pixiv Inc.
   * @pixiv/three-vrm-materials-hdr-emissive-multiplier is distributed under MIT License
   * https://github.com/pixiv/three-vrm/blob/release/LICENSE
   *)
  (*!
   * @pixiv/three-vrm-materials-v0compat v3.5.5
   * VRM0.0 materials compatibility layer plugin for @pixiv/three-vrm
   *
   * Copyright (c) 2019-2026 pixiv Inc.
   * @pixiv/three-vrm-materials-v0compat is distributed under MIT License
   * https://github.com/pixiv/three-vrm/blob/release/LICENSE
   *)
  (*!
   * @pixiv/three-vrm-node-constraint v3.5.5
   * Node constraint module for @pixiv/three-vrm
   *
   * Copyright (c) 2019-2026 pixiv Inc.
   * @pixiv/three-vrm-node-constraint is distributed under MIT License
   * https://github.com/pixiv/three-vrm/blob/release/LICENSE
   *)
  (*!
   * @pixiv/three-vrm-springbone v3.5.5
   * Spring bone module for @pixiv/three-vrm
   *
   * Copyright (c) 2019-2026 pixiv Inc.
   * @pixiv/three-vrm-springbone is distributed under MIT License
   * https://github.com/pixiv/three-vrm/blob/release/LICENSE
   *)
*/
