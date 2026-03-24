<script lang="ts">
  import { onMount } from "svelte";
  import { Application, Graphics } from "pixi.js";
  export let multiplier = 1;
  let el: HTMLDivElement;

  onMount(async () => {
    const app = new Application();
    await app.init({ width: 720, height: 360, background: "#0b1020" });
    el.appendChild(app.canvas);

    const line = new Graphics();
    app.stage.addChild(line);

    const draw = () => {
      line.clear();
      line.moveTo(0, 340);
      line.stroke({ color: 0x22d3ee, width: 3 });
      const x = Math.min(700, multiplier * 80);
      const y = Math.max(20, 340 - multiplier * 25);
      line.lineTo(x, y);
      line.stroke({ color: 0x22d3ee, width: 3 });
    };

    draw();
    const id = setInterval(draw, 100);
    return () => clearInterval(id);
  });
</script>

<div bind:this={el} class="rounded-xl border border-cyan-500/30 bg-slate-900"></div>
